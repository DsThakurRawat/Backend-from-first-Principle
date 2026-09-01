/**
 * Second tokenisation pass: pick each label's ink from the ground it sits on.
 *
 * The role classifier sees a colour and the element carrying it. That is
 * enough for a label on the page's paper, but not for a label sitting inside
 * a filled shape, because the right ink there depends on the shape, not on
 * what colour the label happened to be in the original artwork.
 *
 * Two cases go wrong without this pass:
 *
 *   - a light label on a saturated fill (white "GET" on a green box) keeps
 *     classifying as a soft accent, which then lands the same hue on itself;
 *   - a label on the inverse plate follows the page's ink tokens, which flip
 *     with the theme while the plate does not, so it disappears in one of them.
 *
 * So: find the shape painted under each label, and move the label onto the ink
 * ramp defined for that ground. Grounds that flip with the theme (paper,
 * surfaces, tints) are left alone -- their inks already flip in step.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = new URL('../src/content/chapters', import.meta.url).pathname;

/* Grounds that stay a solid colour, and the ink ramp each one demands. */
const SATURATED = new Set([
  'accent', 'accent-2', 'accent-soft',
  'ok', 'ok-soft', 'warn', 'warn-2', 'warn-soft',
  'info', 'info-soft', 'plum', 'plum-soft',
  'line-2', 'ink', 'ink-2', 'ink-3',
]);

/* On the inverse plate, each family has its own value mixed for the plate. */
/*
 * Grounds that flip with the theme: pale in light, dark in dark. Ink tokens
 * flip alongside them, so a label here belongs on the ink ramp -- never on
 * `on-accent`, which is pinned to read against a saturated fill and so points
 * the wrong way on half of these.
 */
const FLIPPING = /^(paper|surface|surface-2|[\w]+-(tint|surface))$/;

/* Surface tokens name a ground, never an ink. A label wearing one is a
 * classification slip, and it lands the label on its own background. */
const SURFACE_AS_INK = /^(paper|surface|surface-2|[\w]+-(tint|surface))$/;

const ON_INVERSE = {
  'ink': 'on-inverse', 'paper': 'on-inverse', 'on-accent': 'on-inverse',
  'ink-2': 'on-inverse-2', 'surface': 'on-inverse-2',
  'ink-3': 'on-inverse-3', 'surface-2': 'on-inverse-3',
  'accent': 'on-inverse-accent', 'accent-2': 'on-inverse-accent', 'accent-soft': 'on-inverse-accent',
  'ok': 'on-inverse-ok', 'ok-soft': 'on-inverse-ok',
  'warn': 'on-inverse-warn', 'warn-2': 'on-inverse-warn', 'warn-soft': 'on-inverse-warn',
  'info': 'on-inverse-info', 'info-soft': 'on-inverse-info',
  'plum': 'on-inverse-accent', 'plum-soft': 'on-inverse-accent',
};

const num = (s) => { const v = parseFloat(s); return Number.isFinite(v) ? v : null; };
const attrs = (tag) => {
  const o = {};
  for (const m of tag.matchAll(/([a-zA-Z-]+)\s*=\s*"([^"]*)"/g)) o[m[1]] = m[2];
  return o;
};
const roleOf = (v) => /var\(--dg-([\w-]+)\)/.exec(v ?? '')?.[1] ?? null;

function offsetOf(stack) {
  let x = 0, y = 0;
  for (const t of stack) {
    const m = /translate\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)?/.exec(t.transform ?? '');
    if (m) { x += parseFloat(m[1]); y += parseFloat(m[2] ?? '0'); }
  }
  return { x, y };
}

function contains(s, px, py) {
  const a = s.attrs, o = s.offset;
  if (s.tag === 'rect') {
    const x = (num(a.x) ?? 0) + o.x, y = (num(a.y) ?? 0) + o.y;
    const w = num(a.width), h = num(a.height);
    // A hairline rect is a divider, not a ground.
    if (w == null || h == null || h < 6) return false;
    return px >= x && px <= x + w && py >= y - 2 && py <= y + h + 2;
  }
  if (s.tag === 'circle') {
    const cx = (num(a.cx) ?? 0) + o.x, cy = (num(a.cy) ?? 0) + o.y, r = num(a.r);
    return r != null && r >= 4 && (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
  }
  if (s.tag === 'ellipse') {
    const cx = (num(a.cx) ?? 0) + o.x, cy = (num(a.cy) ?? 0) + o.y;
    const rx = num(a.rx), ry = num(a.ry);
    return rx != null && ry != null && rx >= 4 && ry >= 4
      && ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 <= 1;
  }
  if (s.tag === 'polygon' || s.tag === 'path') {
    const src = s.tag === 'polygon' ? a.points : a.d;
    if (!src) return false;
    const n = (src.match(/-?[\d.]+/g) || []).map(Number).filter(Number.isFinite);
    if (n.length < 4) return false;
    const xs = n.filter((_, i) => i % 2 === 0), ys = n.filter((_, i) => i % 2 === 1);
    const x0 = Math.min(...xs) + o.x, x1 = Math.max(...xs) + o.x;
    const y0 = Math.min(...ys) + o.y, y1 = Math.max(...ys) + o.y;
    if (x1 - x0 < 6 || y1 - y0 < 6) return false;
    return px >= x0 && px <= x1 && py >= y0 - 2 && py <= y1 + 2;
  }
  return false;
}

let moved = 0;
const byGround = new Map();

for (const file of readdirSync(DIR).filter((f) => f.endsWith('.mdx'))) {
  const path = join(DIR, file);
  const src = readFileSync(path, 'utf8');

  const out = src.replace(/<Diagram(?:"[^"]*"|[^>])*>\n([\s\S]*?)\n<\/Diagram>/g, (block) => {
    const shapes = [], labels = [], gStack = [];

    /* The attribute pattern must be greedy and quote-aware. A lazy `[^>]*?`
       stops at the first `>` it can -- including one inside a quoted value
       such as aria-label="client -> server" -- which truncates the tag, makes
       its recorded length wrong, and lets one edit's splice overwrite the
       next one's text. */
    for (const m of block.matchAll(/<(\/?)([a-zA-Z]+)((?:"[^"]*"|'[^']*'|[^>'"])*)(\/?)>/g)) {
      const [full, close, tag, rest, selfClose] = m;
      if (tag === 'g') {
        if (close) gStack.pop(); else if (!selfClose) gStack.push(attrs(rest));
        continue;
      }
      if (close) continue;
      const offset = offsetOf(gStack);
      if (['rect', 'circle', 'ellipse', 'polygon', 'path'].includes(tag)) {
        const a = attrs(rest);
        // Shape fills are opaque by this point (the tokeniser folds any
        // fill-opacity into the token), so every filled shape is a real ground.
        if (a.fill && a.fill !== 'none') shapes.push({ tag, attrs: a, offset, at: m.index });
      } else if (tag === 'text' || tag === 'tspan') {
        labels.push({ full, attrs: attrs(rest), offset, at: m.index });
      }
    }

    const edits = [];
    for (const l of labels) {
      const role = roleOf(l.attrs.fill);
      if (!role) continue;
      const px = num(l.attrs.x), py = num(l.attrs.y);
      if (px == null || py == null) continue;
      const x = px + l.offset.x, y = py + l.offset.y;

      // Topmost shape painted before the label wins.
      let ground = null;
      for (const s of shapes) {
        if (s.at > l.at) break;
        if (contains(s, x, y)) ground = roleOf(s.attrs.fill);
      }
      if (!ground) {
        // Nothing under the label: it sits on the paper, where `on-accent`
        // (pinned to read against a saturated fill) and any surface token
        // both point the wrong way.
        if (role === 'on-accent' || SURFACE_AS_INK.test(role)) {
          edits.push({
            at: l.at, len: l.full.length,
            text: l.full.replace(/fill="var\(--dg-[\w-]+\)"/, 'fill="var(--dg-ink)"'),
          });
          moved++;
          byGround.set('(bare paper)', (byGround.get('(bare paper)') ?? 0) + 1);
        }
        continue;
      }

      /*
       * A surface token names a ground, never an ink, so a label wearing one
       * has no usable colour of its own. Treat it as unset and let the ground
       * decide -- resolving it to plain ink here instead would need a second
       * pass to then move it onto the ground's ramp, and the pipeline would
       * no longer reach its answer in one run.
       */
      const carried = SURFACE_AS_INK.test(role) ? null : role;

      let next = null;
      if (ground === 'inverse') {
        // Already on the plate's ramp: leave the family alone. Re-deriving it
        // would fall through to the generic fallback and flatten a green
        // "ok" label to plain plate ink.
        next = /^on-inverse/.test(role) ? null : (ON_INVERSE[carried ?? 'ink'] ?? 'on-inverse');
      }
      else if (SATURATED.has(ground)) next = 'on-accent';
      else if (carried === null) next = 'ink';
      else if (FLIPPING.test(ground) && role === 'on-accent') next = 'ink';

      if (!next || next === role) continue;
      edits.push({
        at: l.at, len: l.full.length,
        text: l.full.replace(/fill="var\(--dg-[\w-]+\)"/, `fill="var(--dg-${next})"`),
      });
      moved++;
      byGround.set(ground, (byGround.get(ground) ?? 0) + 1);
    }

    let o = block;
    for (const e of edits.sort((a, b) => b.at - a.at)) o = o.slice(0, e.at) + e.text + o.slice(e.at + e.len);
    return o;
  });

  if (out !== src) writeFileSync(path, out);
}

console.log(`reseated ${moved} labels onto the ink ramp of their ground`);
[...byGround.entries()].sort((a, b) => b[1] - a[1])
  .forEach(([g, n]) => console.log(`  ${String(n).padStart(4)}  on --dg-${g}`));
