import type { ComponentType } from 'react'
import { z } from 'zod'
import { AUTHORS, AUTHOR_KEYS } from '~/data/authors'
import type { Author } from '~/data/authors'

/**
 * Blog posts live in src/content/blog/<slug>.mdx. The filename is the slug.
 * Frontmatter is validated here; `pnpm build` runs the content tests first,
 * so an invalid post fails the build. See docs/blog-writing-guide.md.
 */

export const BLOG_PRODUCTS = ['cms', 'pos', 'tracking', 'nfc'] as const
export type BlogProduct = (typeof BLOG_PRODUCTS)[number]

const isoDate = z
  .union([z.string(), z.date()])
  .transform((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v))
  .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'))

export const BlogFrontmatterSchema = z
  .object({
    title: z.string().min(10).max(120),
    /** At most 47 characters so "Title — Viewixsoft" fits in 60. */
    seoTitle: z.string().min(10).max(47),
    description: z.string().min(50).max(155),
    product: z.enum(BLOG_PRODUCTS),
    category: z.string().min(2).max(40),
    tags: z.array(z.string().min(2).max(40)).min(1).max(8),
    publishedAt: isoDate,
    updatedAt: isoDate,
    author: z.enum(AUTHOR_KEYS),
    cover: z.object({ src: z.string().startsWith('/'), alt: z.string().min(5).max(200) }),
    keyTakeaways: z.array(z.string().min(10).max(300)).min(2).max(5),
    faq: z.array(z.object({ question: z.string().min(10).max(160), answer: z.string().min(20).max(600) })).max(8).optional(),
    /** Drafts render in the dev server only and are left out of the sitemap, RSS and llms.txt. */
    draft: z.boolean().default(false),
    // Added at build time by src/lib/mdx/remark-blog-meta.ts.
    readingMinutes: z.number().int().min(1),
    toc: z.array(z.object({ depth: z.union([z.literal(2), z.literal(3)]), text: z.string(), id: z.string() })),
  })
  .refine((f) => f.updatedAt >= f.publishedAt, { message: 'updatedAt is before publishedAt', path: ['updatedAt'] })

export type BlogFrontmatter = z.output<typeof BlogFrontmatterSchema>

export interface BlogPost extends Omit<BlogFrontmatter, 'author'> {
  slug: string
  authorKey: BlogFrontmatter['author']
  author: Author
}

const frontmatters = import.meta.glob<unknown>('./blog/*.mdx', { eager: true, import: 'frontmatter' })
const bodies = import.meta.glob<ComponentType<{ components?: Record<string, unknown> }>>('./blog/*.mdx', {
  import: 'default',
})

const slugOf = (path: string) => path.replace(/^.*\/(.+)\.mdx$/, '$1')

/** Parses every post; throws with the file name on the first invalid one. */
export function parseAllPosts(): BlogPost[] {
  return Object.entries(frontmatters)
    .map(([path, fm]) => {
      const slug = slugOf(path)
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error(`Blog file name must be a lowercase slug: ${path}`)
      const parsed = BlogFrontmatterSchema.safeParse(fm)
      if (!parsed.success) {
        const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
        throw new Error(`Invalid frontmatter in ${path}: ${issues}`)
      }
      const { author, ...rest } = parsed.data
      return { ...rest, slug, authorKey: author, author: AUTHORS[author] }
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

const ALL_POSTS = parseAllPosts()

/** Published posts, newest first. The dev server also lists drafts so they can be reviewed. */
export const BLOG_POSTS: BlogPost[] = import.meta.env.DEV ? ALL_POSTS : ALL_POSTS.filter((p) => !p.draft)

/** Loads a post's compiled MDX body (one chunk per post). */
export async function loadPostBody(slug: string) {
  const loader = bodies[`./blog/${slug}.mdx`]
  return loader ? loader() : null
}
