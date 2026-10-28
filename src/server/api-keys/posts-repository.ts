import '@tanstack/react-start/server-only'
import { desc, eq } from 'drizzle-orm'
import { getDb } from '~/server/db/client'
import { apiPosts, blogPosts } from '~/server/db/schema'

/** Records that a tool created this post, so the API may change it later. */
export async function linkApiPost(postId: string, apiKeyId: string) {
  await getDb().insert(apiPosts).values({ postId, apiKeyId })
}

export async function isApiPost(postId: string) {
  const [row] = await getDb().select({ postId: apiPosts.postId }).from(apiPosts).where(eq(apiPosts.postId, postId))
  return Boolean(row)
}

/** Posts created through the API, newest first. */
export async function listApiPosts() {
  return getDb()
    .select({ id: blogPosts.id, slug: blogPosts.slug, title: blogPosts.title, status: blogPosts.status, updatedAt: blogPosts.updatedAt })
    .from(apiPosts)
    .innerJoin(blogPosts, eq(apiPosts.postId, blogPosts.id))
    .orderBy(desc(blogPosts.updatedAt))
}
