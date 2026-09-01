// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { rehypeHeadingAnchors } from './src/plugins/rehype-heading-anchors.mjs';
import { rehypeWrapTables } from './src/plugins/rehype-wrap-tables.mjs';
import { shikiCodeTitle } from './src/plugins/shiki-code-title.mjs';

export default defineConfig({
  site: 'https://backend-from-first-principle.vercel.app',
  integrations: [mdx(), sitemap()],
  markdown: {
    rehypePlugins: [rehypeHeadingAnchors, rehypeWrapTables],
    // Code blocks are highlighted at build time. Zero runtime cost, and it
    // replaces the hand-rolled highlighter that lived in enhancements.js.
    shikiConfig: {
      themes: { light: 'github-dark', dark: 'github-dark' },
      wrap: false,
      transformers: [shikiCodeTitle],
    },
  },
  build: { format: 'directory' },
});
