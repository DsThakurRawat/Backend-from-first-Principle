import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const publicDir = path.join(root, 'public');
const baseLayout = fs.readFileSync(path.join(root, 'src/layouts/Base.astro'), 'utf8');
const installPrompt = fs.readFileSync(
  path.join(root, 'src/components/InstallPrompt.astro'),
  'utf8',
);

const requiredPublic = [
  'manifest.webmanifest',
  'sw.js',
  'offline.html',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];

for (const relative of requiredPublic) {
  assert.ok(
    fs.existsSync(path.join(publicDir, relative)),
    `expected public/${relative} to exist`,
  );
}

const manifest = JSON.parse(
  fs.readFileSync(path.join(publicDir, 'manifest.webmanifest'), 'utf8'),
);

assert.equal(manifest.display, 'standalone');
assert.equal(manifest.start_url, '/');
assert.equal(manifest.scope, '/');
assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2);
assert.match(manifest.name, /Backend from First Principles/i);

assert.match(baseLayout, /rel="manifest"\s+href="\/manifest\.webmanifest"/);
assert.match(baseLayout, /navigator\.serviceWorker\.register\('\/sw\.js'\)/);
assert.match(baseLayout, /name="theme-color"/);
assert.match(baseLayout, /InstallPrompt/);

assert.match(installPrompt, /beforeinstallprompt/);
assert.match(installPrompt, /data-pwa-install/);
assert.match(installPrompt, /data-pwa-dismiss/);
assert.match(installPrompt, />Install</);
assert.match(installPrompt, /bfp-pwa-dismiss/);
assert.match(installPrompt, /display-mode:\s*standalone/);

const sw = fs.readFileSync(path.join(publicDir, 'sw.js'), 'utf8');
assert.match(sw, /caches\.open/);
assert.match(sw, /offline\.html/);
assert.match(sw, /skipWaiting/);

console.log('pwa checks passed');
