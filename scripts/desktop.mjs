/**
 * The series in a window of its own.
 *
 *   npm run desktop           build if needed, then open the reader
 *   npm run desktop --brave   open in a browser of your choosing
 *   npm run desktop --build   force a rebuild first
 *
 * This is the same dist/ Vercel serves, handed to the browser already on the
 * machine in Chromium's app mode: no address bar, no tabs, its own taskbar
 * icon. That is the whole trick. A packaged shell -- Electron, Tauri -- would
 * mean either a 100MB download or a Rust toolchain for anyone who wanted to
 * read a book offline, and neither is worth it for a static site.
 *
 * Chromium is Chrome, Brave, Edge or Chromium itself, so the app window works
 * on Windows, macOS and Linux with no per-platform code -- only the list of
 * paths below differs. Where none of them is installed -- a Mac with just
 * Safari, a machine with just Firefox -- there is no app mode to borrow, so
 * the reader opens in an ordinary browser tab instead and says so.
 *
 * The reader outlives the terminal it was started from, so closing the window
 * is what stops it. The tab fallback is the exception, and says so when it
 * happens: with no window to close, it holds the terminal and takes Ctrl+C.
 */
import { createServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFile, statSync } from 'node:fs';
import { delimiter, extname, isAbsolute, join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

/* fileURLToPath rather than the .pathname the other scripts here use: on
   Windows that yields /C:/... , which every fs call then fails to find. */
const SELF = fileURLToPath(import.meta.url);
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');

/* Fixed, and not worth making configurable. localStorage is keyed by origin
   and the port is part of the origin, so a port that moved between launches
   would take the reader's chapter progress and theme with it every time.
   4322 rather than 4321, so this can run alongside `npm run dev`. */
const PORT = 4322;
const ORIGIN = `http://127.0.0.1:${PORT}`;

/* Chromium keeps its own profile here: cookies, localStorage, window size.
   Deliberately outside the repo -- under .astro/ or dist/ a rebuild or a
   clean checkout would silently reset the reader's progress. */
const PROFILE = join(
  process.env.LOCALAPPDATA ??
    (process.platform === 'darwin'
      ? join(homedir(), 'Library', 'Application Support')
      : process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share')),
  'backend-from-first-principles',
);

const BROWSERS = {
  chrome: {
    win32: [
      `${process.env.ProgramFiles}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env['ProgramFiles(x86)']}\\Google\\Chrome\\Application\\chrome.exe`,
    ],
    // The binary rather than `open -a`: open returns the moment it has asked
    // Launch Services to start the app, which would lose the exit that tells
    // us the window is gone.
    darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'],
    linux: ['google-chrome', 'google-chrome-stable'],
  },
  brave: {
    win32: [
      `${process.env.ProgramFiles}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
      `${process.env['ProgramFiles(x86)']}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
    ],
    darwin: ['/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'],
    linux: ['brave-browser', 'brave'],
  },
  edge: {
    win32: [
      `${process.env['ProgramFiles(x86)']}\\Microsoft\\Edge\\Application\\msedge.exe`,
      `${process.env.ProgramFiles}\\Microsoft\\Edge\\Application\\msedge.exe`,
    ],
    darwin: ['/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'],
    linux: ['microsoft-edge', 'microsoft-edge-stable'],
  },
  chromium: {
    win32: [`${process.env.ProgramFiles}\\Chromium\\Application\\chrome.exe`],
    darwin: ['/Applications/Chromium.app/Contents/MacOS/Chromium'],
    linux: ['chromium', 'chromium-browser'],
  },
};

/* Edge ships with Windows, so it is the one that cannot be missing on a stock
   machine -- which makes it the right fallback and the wrong default. Passing
   --chrome, --brave, --edge or --chromium skips the search entirely. */
const ORDER = ['chrome', 'brave', 'edge', 'chromium'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  // Pagefind's index reader. Typed properly in case it ever switches to
  // instantiateStreaming, which rejects anything else.
  '.pagefind': 'application/wasm',
};

/* --- helpers ------------------------------------------------------------ */

/**
 * Reads a command line flag.
 *
 * Both `npm run desktop --edge` and `npm run desktop -- --edge` work. npm
 * swallows a flag written before the -- rather than forwarding it, but it
 * also exports it as npm_config_edge, so checking both means nobody has to
 * remember which side of the -- their flag belongs on.
 */
const flag = (name) =>
  process.argv.includes(`--${name}`) || Boolean(process.env[`npm_config_${name}`]);

/** Resolves a browser command to a path, or null if it is not installed. */
function resolve(command) {
  if (isAbsolute(command)) return existsSync(command) ? command : null;
  for (const dir of (process.env.PATH ?? '').split(delimiter)) {
    if (existsSync(join(dir, command))) return join(dir, command);
  }
  return null;
}

/**
 * The browser to open the reader in, or null when none is installed.
 *
 * Exits rather than returning when one was named and is not there: asking for
 * --brave and quietly getting Chrome would be the wrong favour. Called in both
 * halves of the run below, so the background half chooses what the foreground
 * half just reported.
 */
function pickBrowser() {
  const asked = ORDER.find(flag);
  const pathsFor = (name) => BROWSERS[name][process.platform] ?? [];

  for (const name of asked ? [asked] : ORDER) {
    const found = pathsFor(name).map(resolve).find(Boolean);
    if (found) return { name, path: found };
  }

  if (!asked) return null;

  console.error(
    `\n  ${asked} is not installed, or not where this looked:\n` +
      pathsFor(asked)
        .map((candidate) => `    ${candidate}\n`)
        .join('') +
      `\n  Drop --${asked} to use whichever browser is there.\n`,
  );
  process.exit(1);
}

function build() {
  console.log('Building the site...');

  // Through a shell on Windows, where npm is a .cmd that node has refused to
  // spawn directly since the 2024 argument-injection fix -- it fails with
  // EINVAL rather than running. Safe here: the arguments are literals.
  const { error, status } = spawnSync('npm', ['run', 'build'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  // Checked, because a build that never started is otherwise indistinguishable
  // from one that succeeded: spawnSync reports it here, not through status.
  if (error) {
    console.error(`\n  Could not run npm: ${error.message}\n`);
    process.exit(1);
  }
  if (status !== 0) process.exit(status ?? 1);
}

/* --- serve -------------------------------------------------------------- */

const server = createServer((request, response) => {
  const url = new URL(request.url, ORIGIN);

  // Resolved and then re-checked against dist/, so a crafted path cannot walk
  // out of it. Only ever bound to the loopback address, but the site is being
  // served to a real browser and this costs one comparison.
  let file = join(DIST, decodeURIComponent(url.pathname));
  if (!file.startsWith(DIST)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  // build.format is 'directory', so every chapter is a folder with an
  // index.html in it -- the same resolution a static host does.
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');

  readFile(file, (error, body) => {
    if (error) {
      response.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
      return;
    }
    response.writeHead(200, {
      'content-type': MIME[extname(file)] ?? 'application/octet-stream',
      // The window is the only client and it lives for one session; caching
      // would just mean a rebuild not showing up until a hard reload.
      'cache-control': 'no-store',
    });
    response.end(body);
  });
});

server.on('error', (error) => {
  if (error.code !== 'EADDRINUSE') throw error;
  console.error(
    `\n  Port ${PORT} is already in use.\n` +
      '  That is usually the reader already running -- check your taskbar.\n',
  );
  process.exit(1);
});

/** Opens the app window, and stops serving once it is closed. */
function openWindow(chosen) {
  // Only on the very first launch: after that the profile remembers whatever
  // size the reader last left the window at, and passing it would undo that.
  const firstRun = !existsSync(PROFILE);

  const window = spawn(
    chosen.path,
    [
      `--app=${ORIGIN}`,
      `--user-data-dir=${PROFILE}`,
      '--no-first-run',
      '--no-default-browser-check',
      ...(firstRun ? ['--window-size=1180,820'] : []),
    ],
    { stdio: 'ignore' },
  );

  // The dedicated profile is what makes this reliable: it forces a browser
  // process of our own rather than a handoff to one already running, so this
  // exit really does mean the reader's window is gone.
  window.on('exit', () => server.close(() => process.exit(0)));
}

/** Opens the reader in an ordinary tab, for machines with no Chromium. */
function openTab() {
  console.log(
    `\n  No Chromium-based browser found, so this opens as a tab.\n  ${ORIGIN}\n` +
      '  Press Ctrl+C to stop it.\n',
  );
  const openers = { win32: ['cmd', ['/c', 'start', '', ORIGIN]], darwin: ['open', [ORIGIN]] };
  const [command, args] = openers[process.platform] ?? ['xdg-open', [ORIGIN]];
  spawn(command, args, { stdio: 'ignore', detached: true }).unref();
}

/* --- run ---------------------------------------------------------------- */

/**
 * Starts the reader and hands the terminal back.
 *
 * Everything that can fail happens here, while there is still a console to
 * fail on: once the background half is detached its output goes nowhere, so
 * a silent exit would be all anyone saw.
 */
function launch() {
  if (flag('build') || !existsSync(join(DIST, 'index.html'))) build();

  const chosen = pickBrowser();

  // Nothing whose closing could stop the server, so this stays in the
  // foreground and Ctrl+C remains the way out.
  if (!chosen) {
    server.listen(PORT, '127.0.0.1', openTab);
    return;
  }

  // Bound here, in the half that still has a terminal, so an already-running
  // reader is a message rather than a silent death in a detached process.
  // The port is briefly free between this close and the child's listen; on a
  // loopback port nothing realistically races for it.
  server.listen(PORT, '127.0.0.1', () => {
    server.close(() => {
      // Detached, so closing this terminal cannot take the reader with it:
      // no console of its own on Windows, a session of its own on macOS and
      // Linux. The flags come along so the child picks the same browser --
      // and the npm_config_* form of them is already in its environment.
      spawn(process.execPath, [SELF, '--serve', ...process.argv.slice(2)], {
        detached: true,
        stdio: 'ignore',
      }).unref();

      console.log(
        `\n  Backend from First Principles\n  ${chosen.name}  ·  ${ORIGIN}\n` +
          '  Close the window to stop it. This terminal is free.\n',
      );
    });
  });
}

// --serve is the background half re-invoking this file, not something anyone
// is meant to type, so it is read straight from argv rather than via flag().
if (process.argv.includes('--serve')) {
  server.listen(PORT, '127.0.0.1', () => openWindow(pickBrowser()));
} else {
  launch();
}

process.on('SIGINT', () => server.close(() => process.exit(0)));
