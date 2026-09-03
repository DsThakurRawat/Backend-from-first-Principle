/**
 * Groups a code block with the ones right after it into a language-tabbed
 * block, but only when the content actually says they're alternatives: a
 * short paragraph naming the languages ("Go Python" before the pair, or
 * "Go" / "Python" before each one individually) is the pre-Astro content's
 * way of marking two blocks as the same snippet in a different language.
 * Adjacency alone is not enough to merge two blocks — plenty of chapters put
 * a vulnerable example next to its fix, or a command next to its output,
 * and those are sequential reading, not alternatives to toggle between.
 *
 * Shiki has already run by the time this executes, so every `<pre>` carries
 * `data-lang` (see shiki-code-title.mjs).
 */
const LANG_LABELS = new Map([
  ['go', 'Go'],
  ['python', 'Python'],
  ['sql', 'SQL'],
  ['js', 'JavaScript'],
  ['java', 'Java'],
]);

// Sorted longest-first so "SQL" is tried before anything that could be a
// prefix of a longer name (not currently an issue, but peeling depends on
// checking longer candidates first).
const DISPLAY_NAMES = [...LANG_LABELS.values()].sort((a, b) => b.length - a.length);
const LANG_BY_DISPLAY_NAME = new Map([...LANG_LABELS].map(([lang, display]) => [display, lang]));
const TRAILING_TITLE_LABEL_RE = new RegExp(`(?:\\s+(?:${DISPLAY_NAMES.join('|')}))+$`);

export function rehypeCodeTabs() {
  return (tree) => collapse(tree);
}

function collapse(node) {
  if (!node.children) return;
  node.children = collapseChildren(node.children);
  for (const child of node.children) collapse(child);
}

function collapseChildren(children) {
  const result = [];
  let i = 0;

  while (i < children.length) {
    const node = children[i];
    if (!isCodeBlock(node)) {
      result.push(node);
      i++;
      continue;
    }

    // A block only becomes the start of a tab group if a label names its
    // language: a paragraph right before it, right before a single caption
    // line that sits between the label and the code ("GoPython" / "PATCH
    // with ... guard" / go fence / python fence), or — chapter 6's style —
    // baked into the fence's own `title="... Go Python"`. No label, no
    // group: that's what keeps unrelated, merely-adjacent blocks (a fix
    // after a vulnerable example, a command after its output) from being
    // treated as language alternatives.
    const lead = trailingLabelInfo(result);
    const fromParagraph = lead?.words.has(getLang(node)) === true;
    const titleLead = fromParagraph ? null : titleLabelInfo(node);
    const leadWords = fromParagraph
      ? lead.words
      : titleLead?.words.has(getLang(node))
        ? titleLead.words
        : null;
    if (!leadWords) {
      result.push(node);
      i++;
      continue;
    }

    const group = [node];
    const seenLangs = new Set([getLang(node)]);
    let next = i + 1;

    while (next < children.length) {
      const k = skipWhitespace(children, next);
      const betweenLabel = wordsOf(children[k]);
      const afterLabel = betweenLabel ? skipWhitespace(children, k + 1) : k;
      const candidate = children[afterLabel];
      const lang = candidate && getLang(candidate);
      const covered = lang && (leadWords.has(lang) || (betweenLabel && betweenLabel.has(lang)));

      if (isCodeBlock(candidate) && !seenLangs.has(lang) && covered) {
        group.push(candidate);
        seenLangs.add(lang);
        next = afterLabel + 1;
      } else {
        break;
      }
    }

    if (group.length >= 2) {
      if (fromParagraph) {
        // Drop only the label paragraph itself — a real caption sitting
        // between it and the code ("PATCH with ... guard") stays put.
        result.splice(lead.labelIndex, 1);
      } else if (titleLead.clean) {
        node.properties['data-title'] = titleLead.clean;
      } else {
        delete node.properties['data-title'];
      }
      result.push(buildTabs(group));
    } else {
      result.push(node);
    }
    i = next;
  }

  return result;
}

// Plain toggle buttons, not ARIA `role="tab"`: the tab role promises the
// arrow-key model from the ARIA tabs pattern, and announcing that without
// implementing it is worse than leaving these as the buttons they are.
// `aria-pressed` carries the selected state and Tab/Enter work for free.
function buildTabs(group) {
  const tabs = group.map((pre, idx) => ({
    type: 'element',
    tagName: 'button',
    properties: {
      type: 'button',
      className: idx === 0 ? ['code-tab', 'on'] : ['code-tab'],
      'data-lang': getLang(pre),
      'aria-pressed': idx === 0 ? 'true' : 'false',
    },
    children: [{ type: 'text', value: langLabel(getLang(pre)) }],
  }));

  const panels = group.map((pre, idx) => ({
    type: 'element',
    tagName: 'div',
    properties: {
      className: idx === 0 ? ['code-panel', 'on'] : ['code-panel'],
      'data-panel': getLang(pre),
      hidden: idx === 0 ? undefined : true,
    },
    children: [pre],
  }));

  return {
    type: 'element',
    tagName: 'div',
    properties: { className: ['codeblock'] },
    children: [
      {
        type: 'element',
        tagName: 'div',
        properties: { className: ['code-bar'] },
        children: tabs,
      },
      ...panels,
    ],
  };
}

function isWhitespaceText(node) {
  return node?.type === 'text' && /^\s*$/.test(node.value);
}

function skipWhitespace(children, idx) {
  while (idx < children.length && isWhitespaceText(children[idx])) idx++;
  return idx;
}

// Looks back from the end of `result` for a label paragraph, tolerating one
// plain caption paragraph sitting between the label and the code that
// follows. Returns the label's languages and its index, so only the label
// itself gets removed once a group forms — the caption, if any, stays.
function trailingLabelInfo(result) {
  const idx = skipWhitespaceBack(result, result.length - 1);
  if (idx < 0) return null;

  const direct = wordsOf(result[idx]);
  if (direct) return { words: direct, labelIndex: idx };

  if (result[idx].type === 'element' && result[idx].tagName === 'p') {
    const labelIdx = skipWhitespaceBack(result, idx - 1);
    const words = labelIdx >= 0 ? wordsOf(result[labelIdx]) : null;
    if (words) return { words, labelIndex: labelIdx };
  }

  return null;
}

// A fence's own `title="create_book / handler Go Python"` can carry the
// label instead of a separate paragraph. `clean` is the title with that
// trailing tag removed, for once the tab bar makes it redundant.
function titleLabelInfo(pre) {
  const title = pre.properties?.['data-title'];
  if (typeof title !== 'string') return null;
  const m = title.match(TRAILING_TITLE_LABEL_RE);
  if (!m) return null;
  const words = peelDisplayNames(m[0].replace(/\s+/g, ''));
  return words && { words, clean: title.slice(0, m.index).trimEnd() };
}

function skipWhitespaceBack(arr, idx) {
  while (idx >= 0 && isWhitespaceText(arr[idx])) idx--;
  return idx;
}

function isCodeBlock(node) {
  if (node?.type !== 'element' || node.tagName !== 'pre') return false;
  const cls = node.properties?.class;
  const isAstroCode = typeof cls === 'string' ? cls.includes('astro-code') : Array.isArray(cls) && cls.includes('astro-code');
  return isAstroCode && !!node.properties?.['data-lang'];
}

function getLang(pre) {
  return pre.properties?.['data-lang'];
}

function langLabel(lang) {
  return LANG_LABELS.get(lang) ?? (lang ? lang[0].toUpperCase() + lang.slice(1) : lang);
}

// A label names one or more languages by their display name, written with
// or without spaces/case variation between them ("Go Python", "GoPython",
// "SQLGoPython"), optionally led by a filename with no separator before the
// name ("pipeline.goGo", "type_validation.goGo"). The whole paragraph must
// resolve this way, so real captions ("PATCH with optimistic-concurrency
// guard") never get mistaken for one.
function wordsOf(node) {
  if (node?.type !== 'element' || node.tagName !== 'p') return null;
  const text = toText(node);
  if (!text.trim() || text.length > 60) return null;

  // Bullets/dots are sometimes used as separators instead of a plain
  // space ("● Go● Python"); strip those too before trying a pure match.
  const pure = peelDisplayNames(text.replace(/[\s●•·]+/g, ''));
  if (pure) return pure;

  const compact = text.replace(/\s+/g, '');
  for (const name of DISPLAY_NAMES) {
    if (!compact.endsWith(name)) continue;
    const prefix = compact.slice(0, -name.length);
    if (prefix && /^[\w./-]+$/.test(prefix)) return new Set([LANG_BY_DISPLAY_NAME.get(name)]);
  }
  return null;
}

function peelDisplayNames(text) {
  let rest = text;
  const langs = new Set();
  while (rest.length) {
    const name = DISPLAY_NAMES.find((n) => rest.startsWith(n));
    if (!name) return null;
    langs.add(LANG_BY_DISPLAY_NAME.get(name));
    rest = rest.slice(name.length);
  }
  return langs.size ? langs : null;
}

function toText(node) {
  if (node.type === 'text') return node.value;
  if (!node.children) return '';
  return node.children.map(toText).join('');
}
