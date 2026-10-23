import { readFile } from 'node:fs/promises'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { parse as parseYaml } from 'yaml'
import type { Plugin } from 'vite'
import remarkBlogMeta from './remark-blog-meta.ts'

/**
 * MDX compiled at build time into ordinary React modules: no runtime compiler,
 * no `eval`, which Cloudflare Workers forbid. Shared by vite and vitest configs.
 */
export function mdxPlugin() {
  return [
    {
      enforce: 'pre' as const,
      ...mdx({
        remarkPlugins: [remarkFrontmatter, remarkGfm, remarkBlogMeta, [remarkMdxFrontmatter, { name: 'frontmatter' }]],
      }),
    },
    mdxMetaPlugin(),
  ]
}

const META_QUERY = '?meta'
// Virtual id for `post.mdx?meta`. It must not end in .mdx, or the MDX
// compiler (which ignores queries) would compile it as a post.
const META_PREFIX = '\0viewixsoft-mdx-meta:'
const META_SUFFIX = '.meta.js'

/**
 * `post.mdx?meta` resolves to only `export const frontmatter = {...}`, with
 * the same reading time and table of contents remark-blog-meta adds. The blog
 * list imports this, so post bodies stay in their own lazily loaded chunks
 * instead of shipping on every page.
 */
function mdxMetaPlugin(): Plugin {
  return {
    name: 'viewixsoft:mdx-meta',
    enforce: 'pre',
    async resolveId(source, importer) {
      if (!source.endsWith(`.mdx${META_QUERY}`)) return null
      const resolved = await this.resolve(source.slice(0, -META_QUERY.length), importer, { skipSelf: true })
      return resolved ? `${META_PREFIX}${resolved.id}${META_SUFFIX}` : null
    },
    async load(id) {
      if (!id.startsWith(META_PREFIX)) return null
      const file = id.slice(META_PREFIX.length, -META_SUFFIX.length)
      // Virtual ids are not watched by default; without this, editing a post's
      // frontmatter in dev would leave the blog list stale.
      this.addWatchFile(file)
      const source = await readFile(file, 'utf8')
      const tree = unified().use(remarkParse).use(remarkFrontmatter).use(remarkGfm).parse(source)
      remarkBlogMeta()(tree)
      const yamlNode = tree.children.find((n) => n.type === 'yaml')
      const data: unknown = yamlNode && 'value' in yamlNode ? parseYaml(yamlNode.value) : {}
      return `export const frontmatter = ${JSON.stringify(data)}`
    },
  }
}
