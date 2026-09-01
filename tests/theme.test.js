/**
 * Theme system invariants.
 *
 * The old site patched dark mode from three places and its test asserted on
 * literal hex values, which is what made the palette impossible to change.
 * These tests assert the *structure* instead: that themes are a token swap,
 * that no rule outside the token file hardcodes a colour, and that the page
 * text clears WCAG AA in both themes.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const tokens = read('src/styles/tokens.css');

const hex = (s) => {
  const h = s.length === 4 ? s.slice(1).split('').map((c) => c + c).join('') : s.slice(1);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const lum = ([r, g, b]) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a, b) => {
  const [hi, lo] = [lum(hex(a)), lum(hex(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

function palette(which) {
  const start = which === 'dark'
    ? tokens.indexOf(":root[data-theme='dark']")
    : tokens.indexOf(':root {');
  const block = tokens.slice(start, tokens.indexOf('\n}', start));
  const out = {};
  for (const m of block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,6})\s*;/g)) out[m[1]] = m[2];
  return out;
}

test('dark mode redefines the palette rather than overriding rules', () => {
  const light = palette('light');
  const dark = palette('dark');
  /*
   * Code blocks keep a dark ground in both themes (see tokens.css), so their
   * surface and syntax colours are deliberately theme-stable. Every other
   * role the light theme defines must be answered by the dark one -- if it
   * is not, some rule somewhere has to patch it, which is the coupling this
   * whole design removes.
   */
  const THEME_STABLE = /^(syn-|code-)/;
  const missing = Object.keys(light).filter((k) => !THEME_STABLE.test(k) && !(k in dark));
  assert.deepEqual(missing, [], 'dark theme is missing colour roles, so some rule must be patching them');
});

test('no stylesheet outside tokens.css hardcodes a colour', () => {
  const offenders = [];
  for (const file of ['src/styles/base.css', 'src/styles/prose.css']) {
    const css = read(file);
    for (const m of css.matchAll(/(?<!-)(#[0-9a-fA-F]{3,8})\b/g)) {
      // Inside a url()-encoded SVG a literal is unavoidable.
      const before = css.slice(Math.max(0, m.index - 60), m.index);
      if (before.includes('url(')) continue;
      offenders.push(`${file}: ${m[1]}`);
    }
  }
  assert.deepEqual(offenders, [], 'colours belong in tokens.css so a theme is one file to change');
});

for (const theme of ['light', 'dark']) {
  test(`${theme}: page text meets WCAG AA`, () => {
    const p = palette(theme);
    const pairs = [
      ['ink', 'bg'], ['ink-2', 'bg'], ['ink-3', 'bg'],
      ['ink', 'surface'], ['ink-2', 'surface'], ['ink-3', 'surface'],
      ['accent', 'bg'], ['accent', 'surface'],
      ['ok', 'ok-bg'], ['warn', 'warn-bg'], ['info', 'info-bg'],
      ['accent-ink', 'accent'],
    ];
    const fails = pairs
      .filter(([f, b]) => p[f] && p[b])
      .map(([f, b]) => [f, b, contrast(p[f], p[b])])
      .filter(([, , r]) => r < 4.5)
      .map(([f, b, r]) => `--${f} on --${b} = ${r.toFixed(2)}:1`);
    assert.deepEqual(fails, []);
  });
}

test('the theme bootstrap runs before paint and matches the toggle', () => {
  const base = read('src/layouts/Base.astro');
  const toggle = read('src/components/ThemeToggle.astro');
  assert.match(base, /is:inline/, 'the pre-paint script must be inline or the page flashes');
  const key = /['"]([\w-]+)['"]/.exec(/KEY\s*=\s*(['"][\w-]+['"])/.exec(base)?.[1] ?? '')?.[1];
  assert.ok(key, 'Base.astro must define a storage key');
  assert.ok(toggle.includes(`'${key}'`), 'the toggle must write the same storage key the bootstrap reads');
});
