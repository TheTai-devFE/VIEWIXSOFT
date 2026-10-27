import '@tanstack/react-start/server-only'
import { and, desc, eq } from 'drizzle-orm'
import { getDb } from '~/server/db/client'
import { blogPosts } from '~/server/db/schema'
import type { BlogPostRow, NewBlogPost } from '~/server/db/schema'
import type { BlogPostFormInput } from '~/lib/admin-schemas'

export async function listAllBlogPosts(): Promise<BlogPostRow[]> {
  return getDb().select().from(blogPosts).orderBy(desc(blogPosts.createdAt))
}

export async function listPublishedBlogPosts(): Promise<BlogPostRow[]> {
  return getDb()
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.status, 'published'))
    .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt))
}

export async function getBlogPostById(id: string): Promise<BlogPostRow | null> {
  const [row] = await getDb().select().from(blogPosts).where(eq(blogPosts.id, id))
  return row ?? null
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostRow | null> {
  const [row] = await getDb().select().from(blogPosts).where(eq(blogPosts.slug, slug))
  return row ?? null
}

/** `userId` becomes the post's owner and last editor. */
export async function createBlogPost(input: BlogPostFormInput, userId: string): Promise<BlogPostRow> {
  const isPublished = input.status === 'published'
  const [row] = await getDb()
    .insert(blogPosts)
    .values({
      slug: input.slug,
      title: input.title,
      seoTitle: input.seoTitle || null,
      description: input.description,
      content: input.content,
      coverUrl: input.coverUrl || null,
      coverAlt: input.coverAlt || null,
      category: input.category,
      product: input.product,
      tags: input.tags,
      authorId: input.authorId ?? null,
      authorName: input.authorName,
      authorRole: input.authorRole || null,
      keyTakeaways: input.keyTakeaways,
      seoDescription: input.seoDescription || null,
      faq: input.faq,
      status: input.status,
      publishedAt: isPublished ? new Date() : null,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning()
  if (!row) throw new Error('Failed to insert blog post')
  return row
}

export async function updateBlogPost(id: string, input: Partial<BlogPostFormInput>, userId: string): Promise<BlogPostRow | null> {
  const existing = await getBlogPostById(id)
  if (!existing) return null

  const isPublished = input.status === 'published'
  const publishedAt = isPublished && !existing.publishedAt ? new Date() : existing.publishedAt

  const updateData: Partial<NewBlogPost> = {
    updatedAt: new Date(),
    updatedBy: userId,
  }

  if (input.slug !== undefined) updateData.slug = input.slug
  if (input.title !== undefined) updateData.title = input.title
  if (input.seoTitle !== undefined) updateData.seoTitle = input.seoTitle || null
  if (input.description !== undefined) updateData.description = input.description
  if (input.content !== undefined) updateData.content = input.content
  if (input.coverUrl !== undefined) updateData.coverUrl = input.coverUrl || null
  if (input.coverAlt !== undefined) updateData.coverAlt = input.coverAlt || null
  if (input.category !== undefined) updateData.category = input.category
  if (input.product !== undefined) updateData.product = input.product
  if (input.tags !== undefined) updateData.tags = input.tags
  if (input.authorName !== undefined) updateData.authorName = input.authorName
  if (input.authorRole !== undefined) updateData.authorRole = input.authorRole || null
  if (input.keyTakeaways !== undefined) updateData.keyTakeaways = input.keyTakeaways
  if (input.authorId !== undefined) updateData.authorId = input.authorId
  if (input.seoDescription !== undefined) updateData.seoDescription = input.seoDescription || null
  if (input.faq !== undefined) updateData.faq = input.faq
  if (input.status !== undefined) {
    updateData.status = input.status
    updateData.publishedAt = publishedAt
  }

  const [row] = await getDb().update(blogPosts).set(updateData).where(eq(blogPosts.id, id)).returning()
  return row ?? null
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  const result = await getDb().delete(blogPosts).where(eq(blogPosts.id, id)).returning({ id: blogPosts.id })
  return result.length > 0
}
