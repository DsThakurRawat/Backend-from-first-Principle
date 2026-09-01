/**
 * Shiki transformer: lifts ```lang title="server.go" onto the <pre> as data
 * attributes, so the stylesheet can render a filename bar without any
 * runtime JavaScript.
 */
export const shikiCodeTitle = {
  name: 'bfp:code-title',
  pre(node) {
    const raw = this.options.meta?.__raw ?? '';
    const title = raw.match(/title="([^"]+)"/)?.[1];
    if (title) node.properties['data-title'] = title;
    node.properties['data-lang'] = this.options.lang ?? '';
  },
};
