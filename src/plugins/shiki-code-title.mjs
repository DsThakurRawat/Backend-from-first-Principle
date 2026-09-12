/**
 * Shiki transformer: lifts ```lang title="server.go" onto the <pre> as data
 * attributes, so the stylesheet can render a filename bar without any
 * runtime JavaScript.
 *
 * Also lifts ```lang tab="Go", which names the tab a block should sit under
 * when the fence language is NOT the thing that distinguishes the
 * alternatives. Five Dockerfiles are all `dockerfile`, so without this they
 * could never be grouped; with it, each says which language it builds for.
 */
export const shikiCodeTitle = {
  name: 'bfp:code-title',
  pre(node) {
    const raw = this.options.meta?.__raw ?? '';
    const title = raw.match(/title="([^"]+)"/)?.[1];
    if (title) node.properties['data-title'] = title;
    const tab = raw.match(/tab="([^"]+)"/)?.[1];
    if (tab) node.properties['data-tab'] = tab;
    node.properties['data-lang'] = this.options.lang ?? '';
  },
};
