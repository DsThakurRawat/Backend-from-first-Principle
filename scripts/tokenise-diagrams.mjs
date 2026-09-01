/**
 * Rewrites the migrated diagrams from literal hex colours to semantic tokens.
 *
 * The 275 inherited SVGs bake a warm-paper palette into ~5,600 `fill` and
 * `stroke` attributes across 130 distinct values. That is why the diagrams
 * could not follow the theme: the only way to keep them readable in dark
 * mode was to pin a light plate behind them, which looked like a hole in the
 * page and made every label's contrast depend on which theme was active.
 *
 * So each colour is classified by role -- ink, accent, ok, warn, info,
 * surface, line -- and replaced with `var(--dg-<role>)`. Diagram.astro then
 * defines one value per role per theme, both sides contrast-checked. The
 * artwork becomes theme-aware, and contrast is guaranteed by construction
 * rather than repaired label by label.
 *
 * Role depends on where a colour is used, not just what it is: `#fff` on a
 * <text> is ink sitting on a coloured shape, while `#fff` on a <rect> is a
 * surface. The same is true of `#211e1a`, which is body ink as a label and a
 * dark panel as a shape.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = new URL('../src/content/chapters', import.meta.url).pathname;

/* The legacy palette, by role. Anything not listed is classified by hue. */
const KNOWN = {
  // inks
  '#211e1a': 'ink',    '#1a1a1a': 'ink',    '#000': 'ink',      '#000000': 'ink',
  '#5b5347': 'ink-2',  '#4a4640': 'ink-2',  '#666': 'ink-2',    '#666666': 'ink-2',
  '#8d8475': 'ink-3',  '#9c948a': 'ink-3',  '#7d7468': 'ink-3', '#9a9182': 'ink-3',
  '#9a8f78': 'ink-3',  '#999': 'ink-3',     '#999999': 'ink-3', '#8a857a': 'ink-3',
  // paper / surfaces
  '#fff': 'paper',     '#ffffff': 'paper',  '#f3ede2': 'paper',
  '#ece3d4': 'surface','#e6dcca': 'surface-2', '#f7f5f0': 'paper', '#faf9f5': 'paper',
  // lines
  '#d8cfbe': 'line',   '#c7bca6': 'line-2', '#ddd': 'line', '#ccc': 'line-2',
  // accent (red)
  '#b8402e': 'accent', '#8f2f20': 'accent-2', '#7a4135': 'accent-2',
  '#e0896a': 'accent-soft', '#f4ded6': 'accent-surface', '#e3c4b8': 'accent-border',
  '#eccdc2': 'accent-border', '#f4d9cf': 'accent-surface', '#f4e2e0': 'accent-surface',
  '#f7e9e2': 'accent-surface',
  // ok (green)
  '#3f6f4e': 'ok',     '#a9c98a': 'ok-soft', '#e0e9dd': 'ok-surface',
  '#bcd3b6': 'ok-border', '#dbeede': 'ok-surface',
  // warn (gold)
  '#b07d2b': 'warn',   '#8a6420': 'warn-2', '#d8b66a': 'warn-soft',
  '#f0e5c9': 'warn-surface', '#ddc79a': 'warn-border',
  // info (blue)
  '#37607f': 'info',   '#7fb0c9': 'info-soft', '#dee5ee': 'info-surface',
  '#bcd4d4': 'info-border',
  // plum
  '#c58fb0': 'plum',
  // inverse panels (a dark box on the light page)
  '#232019': 'inverse', '#2a231c': 'inverse', '#17120e': 'inverse',
  '#e9e2d3': 'on-inverse',
};

/*
 * Some diagrams referenced the old per-chapter stylesheet's variables rather
 * than a literal colour. Those stylesheets are gone, so these resolved to
 * nothing and the shapes fell back to black. Map them onto the same roles.
 */
const LEGACY_VARS = {
  'var(--ink)': 'ink', 'var(--ink-soft)': 'ink-2', 'var(--muted)': 'ink-3',
  'var(--red)': 'accent', 'var(--red-deep)': 'accent-2',
  'var(--line-strong)': 'line-2', 'white': 'paper',
};

/* ------------------------------------------------------------- classify -- */

const hex = (s) => {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

/** Hue in degrees, saturation and lightness in 0..1. */
function hsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  const l = (mx + mn) / 2;
  return { h, s: d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)), l };
}

/** Family from hue: which semantic ramp does this colour belong to? */
function family(h) {
  if (h < 20 || h >= 330) return 'accent';
  if (h < 50) return 'accent';        // warm orange-reds read as the accent
  if (h < 70) return 'warn';
  if (h < 160) return 'ok';
  if (h < 260) return 'info';
  return 'plum';
}

/**
 * @param {string} value  the raw attribute value
 * @param {boolean} isText  is this on a <text>/<tspan>?
 * @param {boolean} isStroke  is this a stroke rather than a fill?
 */
function roleOf(value, isText, isStroke) {
  const v = value.trim().toLowerCase();

  if (LEGACY_VARS[v]) {
    const r = LEGACY_VARS[v];
    return r === 'paper' && isText ? 'on-accent' : r;
  }

  /*
   * Translucent washes. A white veil over a shape was the original way to
   * lighten it; in dark mode the equivalent gesture is to darken, so the veil
   * has to be a token rather than a fixed rgba. Low-alpha colour washes become
   * a tint token for their hue, which keeps the wash faint in both themes
   * without leaving a light patch on a dark page.
   */
  const rgbaM = /^rgba\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)[\s,/]+([\d.]+)\s*\)$/.exec(v);
  if (rgbaM) {
    const [, R, G, B, A] = rgbaM.map(Number);
    const neutral = Math.max(R, G, B) - Math.min(R, G, B) < 18;
    if (neutral) return 'veil';
    if (A <= 0.25) return `${family(hsl([R, G, B]).h)}-tint`;
    return family(hsl([R, G, B]).h);
  }

  const known = KNOWN[v];

  if (known) {
    // `paper` and `ink` swap meaning depending on what carries them.
    if (known === 'paper' && isText) return 'on-accent';
    if (known === 'ink' && !isText && !isStroke) return 'inverse';
    if (known === 'inverse' && isText) return 'ink';
    if (known === 'on-inverse' && !isText && !isStroke) return 'surface';
    return known;
  }

  const rgb = hex(v);
  if (!rgb) return null;                       // rgba()/named: left alone
  const { h, s, l } = hsl(rgb);

  if (s < 0.12) {
    // Neutral: position on the light-to-dark ramp decides the role.
    if (isStroke) return l > 0.6 ? 'line' : 'line-2';
    if (isText) return l < 0.35 ? 'ink' : l < 0.6 ? 'ink-2' : 'ink-3';
    return l > 0.9 ? 'paper' : l > 0.75 ? 'surface' : l > 0.5 ? 'surface-2' : 'inverse';
  }

  const fam = family(h);
  if (isText || isStroke) return l < 0.45 ? fam : `${fam}-soft`;
  return l > 0.72 ? `${fam}-surface` : l > 0.55 ? `${fam}-border` : fam;
}

/**
 * Folds a shape's `fill-opacity` into its colour token.
 *
 * A translucent fill makes the ground under a label depend on whatever is
 * behind it, which is exactly the thing the token system exists to pin down:
 * the same wash reads as a pale panel over light paper and as a barely-there
 * smudge over dark paper, so a label on it is legible in one theme and not
 * the other. The palette already has a tint and a surface step per family, so
 * the wash can be expressed as one of those and the opacity dropped.
 *
 * Text keeps its opacity: a faded label is a deliberate emphasis choice, and
 * it is not a ground for anything else.
 */
function flattenOpacity(attrs, isText) {
  if (isText) return attrs;

  // Both spellings matter: `fill-opacity` fades just the fill, `opacity`
  // fades the whole shape. Either one leaves a translucent ground.
  const fo = /\bfill-opacity="([\d.]+)"/.exec(attrs);
  const op = /\sopacity="([\d.]+)"/.exec(attrs);
  if (!fo && !op) return attrs;

  const alpha = (fo ? Number(fo[1]) : 1) * (op ? Number(op[1]) : 1);
  const strip = (a) => [fo?.[0], op?.[0]].filter(Boolean)
    .reduce((acc, frag) => acc.replace(frag, ''), a).replace(/\s{2,}/g, ' ');

  if (!Number.isFinite(alpha) || alpha >= 0.85) return strip(attrs);

  const role = /\bfill="var\(--dg-([\w-]+)\)"/.exec(attrs)?.[1];
  if (!role) return attrs;

  const base = role.replace(/-(soft|2|tint|surface|border)$/, '');
  const HAS_TINT = ['accent', 'ok', 'warn', 'info', 'plum'];
  let next;
  if (HAS_TINT.includes(base)) next = alpha <= 0.35 ? `${base}-tint` : `${base}-surface`;
  else next = alpha <= 0.35 ? 'surface' : 'surface-2';

  flattened++;
  return strip(attrs).replace(/\bfill="var\(--dg-[\w-]+\)"/, `fill="var(--dg-${next})"`);
}

/**
 * Points every label at one of the three fonts the site actually loads.
 *
 * The artwork names six families -- JetBrains Mono, Source Sans 3, Libre
 * Franklin, Playfair Display, Hanken Grotesk -- none of which the new site
 * ships. Each one silently fell back to a default with different metrics, and
 * a label sized to fit its box in the original then overflowed it.
 *
 * The mapping keeps the distinction that matters (monospace stays monospace,
 * serif stays serif) and drops the rest.
 */
function mapFonts(attrs) {
  return attrs.replace(/font-family="([^"]*)"/g, (whole, family) => {
    const f = family.toLowerCase();
    if (f.includes('mono') || f.includes('courier')) return 'font-family="var(--font-diagram-mono)"';
    if (f.includes('serif') && !f.includes('sans-serif')) return 'font-family="var(--font-prose)"';
    if (f.includes('playfair') || f.includes('georgia')) return 'font-family="var(--font-prose)"';
    return 'font-family="var(--font-ui)"';
  });
}

/* ----------------------------------------------------------------- run --- */

const used = new Map();
let rewritten = 0, left = 0, untitled = 0, flattened = 0;

for (const file of readdirSync(DIR).filter((f) => f.endsWith('.mdx'))) {
  const path = join(DIR, file);
  const src = readFileSync(path, 'utf8');

  const out = src.replace(/<Diagram(?:"[^"]*"|[^>])*>\n([\s\S]*?)\n<\/Diagram>/g, (block) =>
    mapFonts(block).replace(/<(text|tspan|rect|circle|ellipse|polygon|polyline|path|line|g|stop)((?:"[^"]*"|'[^']*'|[^>'"])*)(\/?)>/g,
      (tag, name, attrs, close) => {
        const isText = name === 'text' || name === 'tspan';
        const next = attrs.replace(/\b(fill|stroke|stop-color)="([^"]+)"/g, (whole, prop, value) => {
          if (value === 'none' || value.startsWith('url(') || value === 'context-stroke') return whole;
          if (value.startsWith('var(--dg-')) return whole;
          const role = roleOf(value, isText, prop === 'stroke');
          if (!role) { left++; return whole; }
          used.set(role, (used.get(role) ?? 0) + 1);
          rewritten++;
          return `${prop}="var(--dg-${role})"`;
        });
        // A label with no `fill` inherits SVG's black default, which vanishes
        // on any dark ground. Make the intent explicit instead.
        if (isText && !/\bfill=/.test(next)) {
          untitled++;
          return `<${name}${next} fill="var(--dg-ink)"${close}>`;
        }
        return `<${name}${flattenOpacity(next, isText)}${close}>`;
      }));

  if (out !== src) writeFileSync(path, out);
}

console.log(`rewrote ${rewritten} colour attributes, left ${left} untouched`);
console.log(`gave ${untitled} unstyled labels an explicit ink fill`);
console.log(`folded ${flattened} translucent shape fills into opaque tokens`);
console.log('\ntokens in use:');
[...used.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`  ${String(n).padStart(5)}  --dg-${k}`));
