/**
 * The diagram palette must stay readable in both themes.
 *
 * The migrated SVGs use semantic tokens (--dg-*) rather than literal colours,
 * so their legibility is decided entirely by the two palettes in
 * Diagram.astro. This test pins every foreground/background pairing that
 * actually occurs in the artwork, in both themes, against WCAG AA.
 *
 * If a palette value is changed and a label would become hard to read, this
 * fails -- instead of the problem being discovered by a reader.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const css = fs.readFileSync(path.join(root, 'src/components/Diagram.astro'), 'utf8');

/** Pull the --dg-* declarations out of the light and dark blocks. */
function palette(which) {
  const start = which === 'dark' ? css.indexOf("data-theme='dark'") : css.indexOf('.diagram {');
  const block = css.slice(start, css.indexOf('}', start));
  const out = {};
  for (const m of block.matchAll(/--dg-([\w-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

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

/* Foreground on background, as the artwork actually combines them. */
const PAIRS = [
  ['ink', 'paper'], ['ink-2', 'paper'], ['ink-3', 'paper'],
  ['ink', 'surface'], ['ink-2', 'surface'], ['ink-3', 'surface'],
  ['ink', 'surface-2'], ['ink-2', 'surface-2'],
  ['accent', 'paper'], ['accent-2', 'paper'], ['accent-soft', 'paper'],
  ['accent', 'surface'], ['accent', 'accent-surface'], ['accent-2', 'accent-surface'],
  ['ink', 'accent-surface'], ['ink-2', 'accent-surface'],
  ['on-accent', 'accent'], ['on-accent', 'accent-2'],
  ['ok', 'paper'], ['ok-soft', 'paper'], ['ok', 'surface'],
  ['ok', 'ok-surface'], ['ink', 'ok-surface'], ['ink-2', 'ok-surface'],
  ['warn', 'paper'], ['warn-2', 'paper'], ['warn-soft', 'paper'],
  ['warn', 'warn-surface'], ['warn-2', 'warn-surface'], ['ink', 'warn-surface'],
  ['ink-2', 'warn-surface'],
  ['info', 'paper'], ['info-soft', 'paper'], ['info', 'surface'],
  ['info', 'info-surface'], ['ink', 'info-surface'], ['ink-2', 'info-surface'],
  ['plum', 'paper'], ['plum-soft', 'paper'], ['plum', 'plum-surface'],
  // The inverse plate carries its own ink ramp.
  ['on-inverse', 'inverse'], ['on-inverse-2', 'inverse'], ['on-inverse-3', 'inverse'],
  ['on-inverse-accent', 'inverse'], ['on-inverse-ok', 'inverse'],
  ['on-inverse-warn', 'inverse'], ['on-inverse-info', 'inverse'],
  // Hue washes are surfaces: body ink and the matching accent sit on them.
  ['ink', 'accent-tint'], ['ink', 'ok-tint'], ['ink', 'warn-tint'], ['ink', 'info-tint'],
  ['ink-2', 'accent-tint'], ['ink-2', 'ok-tint'], ['ink-2', 'warn-tint'], ['ink-2', 'info-tint'],
  ['accent', 'accent-tint'], ['ok', 'ok-tint'], ['warn', 'warn-tint'], ['info', 'info-tint'],
];

/*
 * Connectors, arrows and box outlines are graphical objects that carry
 * meaning, so WCAG asks 3:1 -- but measured against the page they sit on,
 * which is what decides whether you can see them. Checking a box outline
 * against its own fill would be measuring the wrong adjacency: the fill is
 * often a barely-tinted surface, and the outline is exactly what makes the
 * box visible against the paper.
 */
const NON_TEXT = [
  ['line', 'paper'], ['line-2', 'paper'], ['line', 'surface'],
  ['accent-border', 'paper'], ['ok-border', 'paper'],
  ['warn-border', 'paper'], ['info-border', 'paper'],
];

for (const theme of ['light', 'dark']) {
  const p = palette(theme);

  test(`${theme}: every diagram token is defined`, () => {
    const roles = new Set();
    for (const file of fs.readdirSync(path.join(root, 'src/content/chapters'))) {
      const t = fs.readFileSync(path.join(root, 'src/content/chapters', file), 'utf8');
      for (const m of t.matchAll(/var\(--dg-([\w-]+)\)/g)) roles.add(m[1]);
    }
    for (const role of roles) {
      assert.ok(p[role], `--dg-${role} is used by a diagram but not defined in the ${theme} palette`);
    }
  });

  test(`${theme}: diagram text meets WCAG AA (4.5:1)`, () => {
    const opaque = (v) => /^#[0-9a-fA-F]{3,6}$/.test(v ?? '');
    const fails = PAIRS
      .filter(([fg, bg]) => opaque(p[fg]) && opaque(p[bg]))
      .map(([fg, bg]) => [fg, bg, contrast(p[fg], p[bg])])
      .filter(([, , r]) => r < 4.5);
    assert.deepEqual(
      fails.map(([fg, bg, r]) => `--dg-${fg} on --dg-${bg} = ${r.toFixed(2)}:1`),
      [],
    );
  });

  test(`${theme}: diagram lines and borders meet AA for non-text (3:1)`, () => {
    const opaque = (v) => /^#[0-9a-fA-F]{3,6}$/.test(v ?? '');
    const fails = NON_TEXT
      .filter(([fg, bg]) => opaque(p[fg]) && opaque(p[bg]))
      .map(([fg, bg]) => [fg, bg, contrast(p[fg], p[bg])])
      .filter(([, , r]) => r < 3);
    assert.deepEqual(
      fails.map(([fg, bg, r]) => `--dg-${fg} on --dg-${bg} = ${r.toFixed(2)}:1`),
      [],
    );
  });
}
