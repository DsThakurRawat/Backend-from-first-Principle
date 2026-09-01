import { visit } from 'unist-util-visit';

/**
 * Wraps every table in a scroll container. A wide comparison table must
 * scroll inside its own box; it must never make the page scroll sideways.
 */
export function rehypeWrapTables() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table' || !parent || index === null) return;
      if (parent.type === 'element' && parent.properties?.className?.includes?.('table-wrap')) return;

      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-wrap'], tabIndex: 0, role: 'region' },
        children: [node],
      };
    });
  };
}
