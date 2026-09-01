import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * The chapter collection is the single source of truth for the series.
 *
 * The homepage grid, the search index, prev/next navigation, the sitemap
 * and the README table of contents are all derived from this. Adding a
 * chapter means adding one file — nothing else needs editing.
 */
const chapters = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/chapters' }),
  schema: z.object({
    /** Position in the series. Must be unique; drives numbering and nav. */
    order: z.number().int().positive(),
    /** Full chapter title, used as the page <h1> and <title>. */
    title: z.string(),
    /** Short form for the sidebar and homepage grid, where space is tight. */
    navTitle: z.string().optional(),
    /** One or two sentences. Shown on the homepage card and in meta tags. */
    summary: z.string(),
    /** Estimated read time, e.g. '3-4 hours'. */
    readingTime: z.string(),
    /** Extra search terms beyond the prose itself. */
    keywords: z.array(z.string()).default([]),
    /** Set true to build the page but hide it from the index and nav. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { chapters };
