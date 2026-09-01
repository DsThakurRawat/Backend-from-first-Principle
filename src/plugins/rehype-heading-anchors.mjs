import { visit } from 'unist-util-visit';

/**
 * Adds a gutter anchor link to every h2/h3.
 *
 * Astro's built-in heading-id plugin has already assigned `id` by the time
 * this runs, and the `headings` array it exposes to layouts uses those same
 * slugs — so we reuse the id rather than slugging again. Computing our own
 * would silently desync the table of contents from the anchors.
 */
export function rehypeHeadingAnchors() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'h2' && node.tagName !== 'h3') return;

      const id = node.properties?.id;
      if (!id) return;
      if (node.children[0]?.properties?.className?.includes?.('anchor')) return;

      node.children.unshift({
        type: 'element',
        tagName: 'a',
        properties: {
          className: ['anchor'],
          href: `#${id}`,
          'aria-label': `Link to section: ${toText(node)}`,
        },
        children: [{ type: 'text', value: '#' }],
      });
    });
  };
}

function toText(node) {
  if (node.type === 'text') return node.value;
  if (!node.children) return '';
  return node.children.map(toText).join('');
}
