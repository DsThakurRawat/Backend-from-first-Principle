/**
 * Migrates all 24 legacy chapters into src/content/chapters/*.mdx.
 *
 * Metadata is recovered from the sources that already held it, rather than
 * retyped: titles and read times from the old homepage grid, search keywords
 * from the CHAPTERS array in the old enhancements.js, and the summary from
 * each page's own subtitle. After this runs, the MDX frontmatter is the only
 * copy and all of those old sources get deleted.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { convert } from './convert-chapter.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = join(ROOT, 'src/content/chapters');

const home = readFileSync(join(ROOT, 'index.html'), 'utf8');
const legacyJs = readFileSync(join(ROOT, 'assets/enhancements.js'), 'utf8');

/* --- recover the chapter list from the old homepage --------------------- */
const rows = [...home.matchAll(
  /<a class="chapter-card" href="([^"]+)">.*?<span class="card-num">(\d+)<\/span>.*?<span class="card-title">(.*?)<\/span><span class="card-meta">(.*?)<\/span>/gs,
)].map(([, href, num, title, time]) => ({
  href: decodeHtml(href),
  order: Number(num),
  navTitle: decodeHtml(title),
  readingTime: time.trim(),
}));

if (rows.length !== 24) throw new Error(`expected 24 chapters on the homepage, found ${rows.length}`);

/* --- recover search keywords from the old hardcoded index ---------------- */
const keywordsByOrder = new Map();
for (const m of legacyJs.matchAll(/\{ n: '(\d+)'.*?keys: '([^']*)'/g)) {
  keywordsByOrder.set(Number(m[1]), m[2].split(/\s+/).filter(Boolean));
}

/* --- convert ------------------------------------------------------------ */
mkdirSync(OUT, { recursive: true });
const report = [];

for (const row of rows) {
  const src = join(ROOT, row.href);
  if (!existsSync(src)) { report.push([row.order, 'MISSING', row.href]); continue; }

  const html = readFileSync(src, 'utf8');
  const num = String(row.order).padStart(2, '0');
  const slug = `${num}-${slugify(row.navTitle)}`;

  let body;
  try { body = convert(html); }
  catch (err) { report.push([row.order, 'FAILED', err.message]); continue; }

  const title = textOf(html, /<h1[^>]*class="(?:chapter-title|title)"[^>]*>([\s\S]*?)<\/h1>/) || row.navTitle;
  const summary = textOf(html, /<p[^>]*class="(?:chapter-subtitle|lede)"[^>]*>([\s\S]*?)<\/p>/)
    || `Chapter ${num} of Backend from First Principles: ${row.navTitle}.`;

  const fm = [
    '---',
    `order: ${row.order}`,
    `title: ${yaml(title)}`,
    `navTitle: ${yaml(row.navTitle)}`,
    `summary: ${yaml(summary)}`,
    `readingTime: ${yaml(row.readingTime)}`,
    'keywords:',
    ...(keywordsByOrder.get(row.order) ?? []).map((k) => `  - ${yaml(k)}`),
    '---',
    '',
  ].join('\n');

  writeFileSync(join(OUT, `${slug}.mdx`), fm + body);
  report.push([row.order, 'ok', `${slug}.mdx`, `${Math.round(body.length / 1024)}KB`]);
}

console.table(report.map(([order, status, detail, size]) => ({ order, status, detail, size })));
const bad = report.filter((r) => r[1] !== 'ok');
if (bad.length) { console.error(`\n${bad.length} chapter(s) did not convert.`); process.exit(1); }

/* --- helpers ------------------------------------------------------------ */
function decodeHtml(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
function textOf(html, re) {
  const m = html.match(re);
  if (!m) return '';
  return decodeHtml(m[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}
function yaml(s) { return JSON.stringify(String(s)); }
function slugify(s) {
  return s.toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
