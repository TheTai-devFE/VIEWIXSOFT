import { BLOG_PRODUCTS } from '~/content/blog'
import type { BlogPost, BlogProduct } from '~/content/blog'
import { extractTocFromMarkdown } from '~/lib/toc'
import type { Author } from '~/data/authors'
import type { AuthorRow, BlogPostRow } from '~/server/db/schema'

const FALLBACK_COVER = '/devices/stock/retail-screens.webp'
const SEO_TITLE_MAX = 47

const isoDate = (d: Date | string) => new Date(d).toISOString().slice(0, 10)

/** A title that fits the search title limit, cut at a word boundary rather than mid-word. */
export function shortTitle(title: string, max = SEO_TITLE_MAX) {
  const clean = title.trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max + 1)
  const space = cut.lastIndexOf(' ')
  return (space > max / 2 ? cut.slice(0, space) : clean.slice(0, max)).replace(/[\s,:;–—-]+$/, '')
}

/** An author profile from /admin/authors, as the post pages and JSON-LD use it. */
export function authorFromRow(a: AuthorRow): Author {
  return {
    name: a.name,
    role: a.role,
    bio: a.bio,
    avatar: a.avatarUrl || '/logo.png',
    kind: a.kind,
    ...(a.profileUrl ? { url: a.profileUrl } : {}),
  }
}

const isProduct = (value: string): value is BlogProduct => (BLOG_PRODUCTS as readonly string[]).includes(value)

/**
 * A post written in /admin/blog, in the shape the blog pages, feeds and
 * Markdown twins use. Pass the post's author profile when it has one;
 * otherwise the plain byline text is used.
 */
export function blogPostFromRow(row: BlogPostRow, author?: AuthorRow | null): BlogPost {
  const publishedAt = isoDate(row.publishedAt ?? row.createdAt)
  const updatedAt = isoDate(row.updatedAt)
  const words = row.content.split(/\s+/).filter(Boolean).length
  return {
    slug: row.slug,
    title: row.title,
    seoTitle: row.seoTitle || shortTitle(row.title),
    description: row.description,
    product: isProduct(row.product) ? row.product : 'cms',
    category: row.category,
    tags: row.tags,
    publishedAt,
    // An edit saved before the first publish must not date the post earlier than its release.
    updatedAt: updatedAt < publishedAt ? publishedAt : updatedAt,
    authorKey: 'viewixsoft-team',
    author: author
      ? authorFromRow(author)
      : {
          name: row.authorName,
          role: row.authorRole ?? '',
          bio: '',
          avatar: '/logo.png',
          // A team byline is published as the Organization, a named writer as a Person.
          kind: /\bteam\b|viewixsoft/i.test(row.authorName) ? 'organization' : 'person',
        },
    cover: { src: row.coverUrl || FALLBACK_COVER, alt: row.coverAlt || row.title },
    keyTakeaways: row.keyTakeaways.filter((t) => t.trim()),
    ...(row.faq.length > 0 ? { faq: row.faq } : {}),
    ...(row.seoDescription ? { seoDescription: row.seoDescription } : {}),
    draft: row.status === 'draft',
    readingMinutes: Math.max(1, Math.round(words / 200)),
    toc: extractTocFromMarkdown(row.content),
  }
}
