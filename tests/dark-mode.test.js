const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const themeCss = fs.readFileSync(path.join(root, 'assets/theme.css'), 'utf8');
const themeJs = fs.readFileSync(path.join(root, 'assets/theme.js'), 'utf8');
const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const chapter = fs.readFileSync(path.join(root, '1.HTTP-AND-CORS/html_notes/notes.html'), 'utf8');
const themeCssText = themeCss;
const chapterPages = [
  ...fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(root, entry.name, 'html_notes', 'notes.html'))
    .filter((file) => fs.existsSync(file)),
];

for (const color of ['#17120e', '#1b1511', '#201914', '#251d17', '#f2e8dc', '#b8a898', '#3d332b', '#f0a03c', '#ffc46b', '#8fce87', '#ff7a6b']) {
  assert.match(themeCss, new RegExp(color, 'i'), `Underhood color ${color} is missing`);
}

assert.match(themeCss, /:root\[data-theme=['"]dark['"]\]/);
assert.doesNotMatch(themeCss, /:root\[data-theme=['"]light['"]\][^{]*\{/);
assert.match(themeJs, /localStorage/);
assert.match(themeJs, /data-theme/);
assert.match(homepage, /assets\/theme\.css/);
assert.match(homepage, /assets\/theme\.js/);
assert.match(chapter, /assets\/theme\.css/);
assert.match(chapter, /assets\/theme\.js/);
assert.match(themeCssText, /:root\[data-theme=['"]dark['"]\] \.chapter-nav/);
assert.match(themeCssText, /\.chapter-nav[\s\S]*background: #201914/);
assert.match(themeCssText, /:root\[data-theme=['"]dark['"]\] \.chapter-nav \.nav-indicator/);
assert.match(themeCssText, /\.nav-indicator[\s\S]*background: #17120e/);
assert.match(themeCssText, /:root\[data-theme=['"]dark['"]\] \.viz/);
assert.match(themeCssText, /\.viz[\s\S]*background: linear-gradient\(180deg, #201914, #17120e\)/);
assert.match(themeCssText, /rect\[fill='#ece3d4'\]/);
assert.match(themeCssText, /rect\[fill='#f7e9e2'\]/);
assert.match(themeCssText, /rect\[fill='#eccdc2'\]/);
assert.match(themeCssText, /text\[fill='#211e1a'\][\s\S]*fill: #f2e8dc/);
assert.match(themeCssText, /figure svg text\[fill='#211e1a'\]/);
assert.match(themeCssText, /figure svg rect\[fill\^='rgba'\]/);
assert.match(themeCssText, /\.fig-frame[\s\S]*background: #201914 !important/);
assert.match(themeCssText, /\.diagram[\s\S]*background: #201914 !important/);
assert.match(themeCssText, /figure svg rect\[fill='#fff'\]/);
assert.match(themeCssText, /figure svg rect\[fill='#f7d9d1'\]/);
assert.match(themeCssText, /figure svg rect\[fill='var\(--ink\)'\]/);
assert.match(themeCssText, /figure svg text\[fill='#fff'\]/);
assert.match(themeCssText, /\.steps\s*>\s*li::before[\s\S]*background: #251d17/);
assert.match(themeCssText, /\.flow[\s\S]*\.fig-wrap[\s\S]*\.diagram-wrap/);
assert.match(themeCssText, /figure > div[\s\S]*background: #201914 !important/);
assert.match(themeCssText, /\.ec-logic[\s\S]*background: #2c1a14 !important/);
assert.match(themeCssText, /\.ec-db[\s\S]*background: #1c2830 !important/);
assert.match(themeCssText, /\.ec-ext[\s\S]*background: #1c2a20 !important/);
assert.match(themeCssText, /\.card-grid \.card[\s\S]*background: #251d17 !important/);
assert.equal(chapterPages.length, 24, 'all 24 chapter pages should be present');
for (const page of chapterPages) {
  const html = fs.readFileSync(page, 'utf8');
  assert.match(html, /assets\/theme\.css/, `${page} is missing dark-mode CSS`);
  assert.match(html, /assets\/theme\.js/, `${page} is missing theme JavaScript`);
}

console.log('dark mode checks passed');
