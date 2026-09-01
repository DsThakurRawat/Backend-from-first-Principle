/**
 * One-shot migration: legacy hand-written notes.html -> MDX chapter.
 *
 * This is a tool, not part of the site build. It exists to move the 24
 * chapters across once; after the cutover it stays in the repo only as the
 * record of how the conversion was done.
 *
 * What it preserves:
 *   - prose, headings, lists and tables  -> real Markdown
 *   - code blocks                        -> fenced blocks (hand-applied
 *                                           highlight spans stripped; Shiki
 *                                           re-highlights at build time)
 *   - inline SVG diagrams                -> <Diagram> with the SVG intact
 *   - callouts                           -> <Callout>
 *
 * What it drops: the per-page <style>, the per-page table of contents, the
 * prev/next bar and the script tags. All four are now the layout's job.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { selectAll, select } from 'hast-util-select';
import { toText } from 'hast-util-to-text';
import { toHtml } from 'hast-util-to-html';

/* ---------------------------------------------------------------- helpers */

const DIAGRAM_CLASSES = [
  'viz', 'diagram-wrap', 'diagram-box', 'diagram-container', 'diagram', 'figure',
];

const CALLOUT_MAP = [
  [/callout-?(warn|danger|red)|note-warn|out-be\b/, 'warn'],
  [/callout-?(ok|good|green)|out-gold|out-god/, 'ok'],
  [/callout|note\b|out\b|ref-box/, 'info'],
];

const classesOf = (node) => {
  const c = node.properties?.className;
  return Array.isArray(c) ? c : typeof c === 'string' ? c.split(/\s+/) : [];
};
const hasClass = (node, name) => classesOf(node).includes(name);

/** Recover plain source from a hand-highlighted <pre>. */
function codeText(pre) {
  return toText(pre, { whitespace: 'pre' }).replace(/\n+$/, '');
}

/** Best-effort language for a fence: explicit attribute, caption, then shape. */
function detectLang(pre, caption = '') {
  const explicit = pre.properties?.dataLang
    ?? select('[data-lang]', pre)?.properties?.dataLang;
  if (explicit) return explicit === 'py' ? 'python' : String(explicit);

  const hay = `${caption}`.toLowerCase();
  if (/\.go\b|\bgo\b|golang/.test(hay)) return 'go';
  if (/\.py\b|python/.test(hay)) return 'python';
  if (/\.ya?ml\b/.test(hay)) return 'yaml';
  if (/\.json\b/.test(hay)) return 'json';
  if (/dockerfile/.test(hay)) return 'dockerfile';
  if (/\.sql\b|postgres|sql/.test(hay)) return 'sql';
  if (/\.sh\b|bash|shell|terminal|\$ /.test(hay)) return 'bash';
  if (/\.proto\b|protobuf/.test(hay)) return 'protobuf';

  const src = codeText(pre);
  if (/^\s*package\s+\w+|func\s+\w+\s*\(|:=/.test(src)) return 'go';
  if (/^\s*(from|import)\s+\w+|def\s+\w+\s*\(|async def/.test(src)) return 'python';
  if (/^\s*(FROM|RUN|CMD|ENTRYPOINT)\s/m.test(src)) return 'dockerfile';
  if (/^\s*\{[\s\S]*"[\w-]+"\s*:/.test(src)) return 'json';
  if (/^\s*(SELECT|INSERT|UPDATE|CREATE TABLE)\b/im.test(src)) return 'sql';
  if (/^\s*[\w-]+:\s*$/m.test(src) && !/[;{}]/.test(src)) return 'yaml';
  if (/^\s*(curl|npm|go |python|docker|kubectl|\$)/m.test(src)) return 'bash';
  return 'text';
}

/**
 * Serialise an SVG for embedding in MDX.
 *
 * MDX parses the children of a JSX block as Markdown, and the legacy SVGs are
 * hand-formatted across many lines. That combination is hostile in several
 * ways at once: a blank line closes the JSX block, a four-space indent starts
 * an indented code block, and a text node that straddles a newline inside
 * nested elements (`<text>...<tspan>` split over two lines) breaks tag
 * matching outright.
 *
 * Rather than play whack-a-mole with formatting rules, each SVG is emitted on
 * a single line. Whitespace between SVG nodes is insignificant, so nothing is
 * lost visually, and every newline-related failure mode disappears at once.
 */
function svgHtml(svg) {
  return toHtml(svg)
    .replace(/\s*\n\s*/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
}

/*
 * Attribute values must not contain a raw `>`: captions routinely hold an
 * arrow ("DNS -> PoP"), and that closes the tag as far as any later pass
 * scanning for `<Diagram ...>` is concerned, silently skipping the diagram.
 */
const escapeAttr = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/\n/g, ' ')
  .trim();

/* ------------------------------------------------------------ the pipeline */

export function convert(html) {
  const tree = unified().use(rehypeParse, { fragment: false }).parse(html);

  const main = select('main.bfp-content', tree);
  if (!main) throw new Error('no <main class="bfp-content"> found');

  // Strip the chrome the layout now owns.
  const drop = new Set([
    ...selectAll('script, style, noscript', main),
    ...selectAll('.chapter-nav, .bfp-toc, .bfp-toc-toggle, .bfp-toc-scrim', main),
    ...selectAll('.chapter-eyebrow, .chapter-title, .chapter-subtitle, .lede', main),
    // Hand-typed section numerals ("01 / DEFINITION"). The h2 counter in
    // prose.css derives these now, so keeping them would double them up --
    // but only drop the label, never a wrapper that holds the heading.
    ...selectAll('.section-num, .sec-num, .kicker, .section-label, .eyebrow, .part-head', main)
      .filter((n) => !select('h1, h2, h3, h4', n)),
  ]);
  prune(main, drop);

  // HTML comments are a syntax error in MDX, and these are all authoring
  // scaffolding ("<!-- SECTION 3 -->") with no reader value.
  dropComments(main);

  const raw = [];   // MDX we hand-build; the markdown pass re-inserts these

  // --- diagrams: keep the SVG verbatim, wrap in a component ---------------
  for (const cls of DIAGRAM_CLASSES) {
    for (const box of selectAll(`.${cls}`, main)) {
      const svg = select('svg', box);
      if (!svg) continue;
      const capNode =
        select('figcaption', box) ??
        select('.diagram-caption', box) ??
        select('.diagram-label', box) ??
        select('.viz-cap', box);
      const caption = capNode ? toText(capNode).trim() : '';
      replaceWithPlaceholder(
        main, box, raw,
        `<Diagram${caption ? ` caption="${escapeAttr(caption)}"` : ''}>\n${svgHtml(svg)}\n</Diagram>`,
      );
    }
  }
  // Bare <svg> that no wrapper claimed.
  for (const svg of selectAll('svg', main)) {
    if (!svg.__consumed) {
      replaceWithPlaceholder(main, svg, raw, `<Diagram>\n${svgHtml(svg)}\n</Diagram>`);
    }
  }

  // --- code blocks --------------------------------------------------------
  for (const pre of selectAll('pre', main)) {
    if (pre.__consumed) continue;
    const caption = captionFor(main, pre);
    const lang = detectLang(pre, caption);
    const fence = '```';
    replaceWithPlaceholder(
      main, pre, raw,
      `${fence}${lang}${caption ? ` title="${escapeAttr(caption)}"` : ''}\n${codeText(pre)}\n${fence}`,
    );
  }

  // --- callouts -----------------------------------------------------------
  for (const box of selectAll('div, aside, blockquote', main)) {
    if (box.__consumed) continue;
    const cls = classesOf(box).join(' ');
    if (!cls) continue;
    const hit = CALLOUT_MAP.find(([re]) => re.test(cls));
    if (!hit) continue;
    let inner = mdOf(box).trim();
    if (!inner) continue;

    // Legacy callouts opened with a bare bold/plain first line acting as the
    // heading. Promote it to the component's `title` so it is styled, not
    // just emphasised text floating at the top of the box.
    let title = '';
    const lines = inner.split('\n');
    const first = lines[0].trim();
    if (first && lines[1]?.trim() === '' && first.length < 90 && !/^[-*>|#`]/.test(first)) {
      title = first.replace(/^\*+|\*+$/g, '');
      inner = lines.slice(2).join('\n').trim();
    }
    const attrs = `type="${hit[1]}"${title ? ` title="${escapeAttr(title)}"` : ''}`;
    replaceWithPlaceholder(main, box, raw, `<Callout ${attrs}>\n${inner}\n</Callout>`);
  }

  // --- everything else -> Markdown ---------------------------------------
  let md = mdOf(main);

  // Re-insert the blocks we built by hand.
  md = md.replace(/§§RAW(\d+)§§/g, (_, i) => raw[Number(i)]);

  return stripPageHeader(sanitizeMdx(md))
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s*-{3,}\s*\n/, '')   // rule left behind by the stripped page header
    // The old pages drew a rule before each section heading by hand. The h2
    // carries its own rule now, so keeping these stacks two lines with a band
    // of dead space between them.
    .replace(/(^|\n)-{3,}\n+(?=##\s)/g, '$1')
    .trim() + '\n';
}

/**
 * Makes converted Markdown safe to parse as MDX.
 *
 * MDX reads a bare `{` as the start of a JSX expression and a bare `<` as the
 * start of a tag, both of which appear legitimately in this prose ("latency
 * < 100ms", "{ id: 1 }" inside a diagram label). Three regions need three
 * different treatments, so this walks the document rather than doing one
 * global replace:
 *
 *   fenced code   - already opaque to MDX; left exactly as written
 *   <Diagram> SVG - JSX children, where a backslash escape does nothing;
 *                   braces become numeric character references
 *   prose         - Markdown text, where backslash escapes do work
 */
/**
 * Removes the masthead each old page carried at the top of its content.
 *
 * Every chapter opened with its own <h1> and a row of badges ("Layer 7 /
 * Application  TCP / QUIC  Go 1.22+  21 sections"). The layout renders the
 * title, the chapter number and the reading time from frontmatter now, so
 * leaving these in prints the title twice and drops a line of run-together
 * fragments under it.
 */
function stripPageHeader(md) {
  let out = md.replace(/^\s+/, '');

  // The title, as either `# Heading` or the underlined Setext form.
  out = out.replace(/^#\s+.*(?:\n|$)/, '');
  out = out.replace(/^(?:.*\n)*?={3,}[ \t]*(?:\n|$)/, (m) =>
    // Only if the underline is within the first few lines: further down it
    // belongs to a real section.
    m.split('\n').length <= 4 ? '' : m);

  // The badge row: short, slash-separated fragments, no sentence punctuation.
  out = out.replace(/^\s*\n?([^\n]{0,200})\n/, (whole, line) => {
    const t = line.trim();
    if (!t) return whole;
    const badgeish = /\bsections?\b/i.test(t) || (t.split('/').length >= 3 && !/[.:;?!]\s/.test(t));
    return badgeish ? '' : whole;
  });

  return out.replace(/^\s+/, '');
}

function sanitizeMdx(md) {
  const lines = md.split('\n');
  let inFence = false;
  let inDiagram = 0;

  return lines
    .map((line) => {
      if (/^\s*```/.test(line)) { inFence = !inFence; return line; }
      if (inFence) return line;

      if (/<Diagram\b/.test(line)) inDiagram++;
      const closing = /<\/Diagram>/.test(line);

      let out;
      if (inDiagram > 0) {
        /*
         * MDX parses the children of a JSX block as Markdown, and that
         * applies inside an SVG too. A label holding a pair of asterisks
         * (an Accept header's wildcard media type, say) therefore becomes
         * emphasis -- and the resulting <em> is an HTML breakout tag, which
         * ends SVG foreign content on the spot: every element after it is
         * parsed as HTML and silently loses its styling.
         *
         * Entity references survive JSX and render as the literal character,
         * so escaping the Markdown-significant ones keeps the label text
         * exactly as drawn while leaving the SVG intact.
         */
        out = line
          .replace(/\{/g, '&#123;').replace(/\}/g, '&#125;')
          .replace(/\*/g, '&#42;').replace(/_/g, '&#95;')
          .replace(/`/g, '&#96;').replace(/\[/g, '&#91;').replace(/\]/g, '&#93;');
      } else {
        out = escapeProse(line);
      }

      if (closing) inDiagram = Math.max(0, inDiagram - 1);
      return out;
    })
    .join('\n');
}

/** Escape MDX-significant characters in prose, skipping inline code spans. */
function escapeProse(line) {
  return line
    .split(/(`[^`]*`)/)
    .map((part) => {
      if (part.startsWith('`')) return part;          // inline code is opaque
      return part
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        // A `<` only stays literal when it is not opening one of our
        // components or a real tag we emitted.
        .replace(/<(?!\/?(?:Callout|Diagram|br\s*\/?|kbd|abbr)\b)/g, '&lt;');
    })
    .join('');
}

function mdOf(node) {
  return unified()
    .use(rehypeRemark, {
      handlers: {
        // Placeholders must survive as literal text, not be escaped.
        text(state, n) { return { type: 'text', value: n.value }; },
      },
    })
    .use(remarkGfm)
    .use(remarkStringify, {
      bullet: '-',
      fences: true,
      rule: '-',
      emphasis: '_',
      strong: '*',
    })
    .stringify(
      unified().use(rehypeRemark).use(remarkGfm).runSync(node),
    );
}

function replaceWithPlaceholder(root, node, raw, mdx) {
  const i = raw.push(mdx) - 1;
  markConsumed(node);
  const parent = findParent(root, node);
  if (!parent) return;
  const at = parent.children.indexOf(node);
  parent.children[at] = { type: 'element', tagName: 'p', properties: {}, children: [{ type: 'text', value: `§§RAW${i}§§` }] };
}

function markConsumed(node) {
  node.__consumed = true;
  for (const c of node.children ?? []) markConsumed(c);
}

function findParent(root, target) {
  let found = null;
  (function walk(n) {
    for (const c of n.children ?? []) {
      if (c === target) { found = n; return; }
      walk(c);
      if (found) return;
    }
  })(root);
  return found;
}

/** A code caption is the `.code-file` / `.code-bar` element just before it. */
function captionFor(root, pre) {
  const parent = findParent(root, pre);
  if (!parent) return '';
  const at = parent.children.indexOf(pre);
  for (let i = at - 1; i >= 0 && i >= at - 3; i--) {
    const sib = parent.children[i];
    if (sib.type !== 'element') continue;
    if (hasClass(sib, 'code-file') || hasClass(sib, 'code-bar') || hasClass(sib, 'code-head')) {
      markConsumed(sib);
      parent.children[i] = { type: 'text', value: '' };
      return toText(sib).replace(/\s+/g, ' ').trim();
    }
    break;
  }
  return '';
}

function dropComments(root) {
  (function walk(n) {
    if (!n.children) return;
    n.children = n.children.filter((c) => c.type !== 'comment');
    n.children.forEach(walk);
  })(root);
}

function prune(root, drop) {
  (function walk(n) {
    if (!n.children) return;
    n.children = n.children.filter((c) => !drop.has(c));
    n.children.forEach(walk);
  })(root);
}

/* ------------------------------------------------------------------- CLI */

if (process.argv[2]) {
  const [, , src, dest] = process.argv;
  const md = convert(readFileSync(src, 'utf8'));
  if (dest) { mkdirSync(dirname(dest), { recursive: true }); writeFileSync(dest, md); }
  else process.stdout.write(md);
}
