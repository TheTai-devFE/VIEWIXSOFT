import '@tanstack/react-start/server-only'
import { BLOG_POSTS } from '~/content/blog'
import { USE_CASES } from '~/content/useCases'
import { blogPostFromRow } from '~/lib/blog-post-from-row'
import { isPageVisible } from '~/lib/page-visibility'
import { forPublic, mergeUseCases } from '~/lib/use-case-from-row'
import type { PublishedContent, PublishedPost } from '~/lib/seo/generators'
import type { SiteConfig } from '~/lib/site-config'
import { listAuthors } from '~/server/authors/repository'
import { listPublishedBlogPosts } from '~/server/blog/repository'
import { postMarkdown } from '~/server/content/blog-raw'
import { hasDatabase } from '~/server/db/client'
import { errorFields, logger } from '~/server/logger'
import { listPublishedUseCases } from '~/server/use-cases/repository'

/** Reads rows from the database, or nothing when it is missing or failing, so the files still render. */
async function rows<T>(event: string, read: () => Promise<T[]>): Promise<T[]> {
  if (!hasDatabase()) return []
  try {
    return await read()
  } catch (error) {
    logger.error(event, errorFields(error))
    return []
  }
}

/**
 * Every published post and case study, from the admin (database) and the
 * bundled MDX/sample files, with database rows winning on the same slug.
 * Pages hidden in the admin are left out. This is the one source for the
 * sitemap, RSS, llms.txt, llms-full.txt and the Markdown twins.
 */
export async function loadPublishedContent(config: SiteConfig | null | undefined): Promise<PublishedContent> {
  const [postRows, useCaseRows, authorRows] = await Promise.all([
    rows('published.blog_failed', listPublishedBlogPosts),
    rows('published.use_cases_failed', listPublishedUseCases),
    rows('published.authors_failed', listAuthors),
  ])

  const authorsById = new Map(authorRows.map((a) => [a.id, a]))
  const fromDb: PublishedPost[] = postRows.map((row) => ({
    post: blogPostFromRow(row, row.authorId ? authorsById.get(row.authorId) : null),
    body: row.content,
  }))
  const dbSlugs = new Set(fromDb.map((p) => p.post.slug))
  const fromFiles: PublishedPost[] = BLOG_POSTS.filter((p) => !p.draft && !dbSlugs.has(p.slug)).map((post) => ({
    post,
    body: postMarkdown(post.slug) ?? '',
  }))

  const posts = isPageVisible(config, '/blog')
    ? [...fromDb, ...fromFiles].sort((a, b) => b.post.publishedAt.localeCompare(a.post.publishedAt))
    : []
  const useCases = mergeUseCases(useCaseRows, USE_CASES)
    .filter((u) => isPageVisible(config, `/case-studies/${u.slug}`))
    .map(forPublic)

  return { posts, useCases }
}
