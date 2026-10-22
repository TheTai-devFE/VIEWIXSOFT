import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkBlogMeta from './remark-blog-meta.ts'

/**
 * MDX compiled at build time into ordinary React modules: no runtime compiler,
 * no `eval`, which Cloudflare Workers forbid. Shared by vite and vitest configs.
 */
export function mdxPlugin() {
  return {
    enforce: 'pre' as const,
    ...mdx({
      remarkPlugins: [remarkFrontmatter, remarkGfm, remarkBlogMeta, [remarkMdxFrontmatter, { name: 'frontmatter' }]],
    }),
  }
}
