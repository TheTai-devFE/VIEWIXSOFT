import '@tanstack/react-start/server-only'
import { desc, eq, inArray, or, sql } from 'drizzle-orm'
import { getDb } from '~/server/db/client'
import { blogPosts, mediaAssets, mediaSlots } from '~/server/db/schema'

export async function listMediaAssets() {
  return getDb().select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt))
}

export async function listMediaSlots() {
  return getDb().select({ key: mediaSlots.key, assetId: mediaSlots.assetId, alt: mediaSlots.alt }).from(mediaSlots)
}

export async function insertMediaAsset(row: typeof mediaAssets.$inferInsert) {
  const [asset] = await getDb().insert(mediaAssets).values(row).returning()
  return asset
}

export async function blogUsesImage(url: string) {
  const [post] = await getDb().select({ id: blogPosts.id }).from(blogPosts)
    .where(or(eq(blogPosts.coverUrl, url), sql`strpos(${blogPosts.content}, ${url}) > 0`)).limit(1)
  return Boolean(post)
}

export async function articleImages(content: string, coverUrl: string | null) {
  const urls = new Set<string>()
  if (coverUrl) urls.add(coverUrl)
  for (const match of content.matchAll(/^!\[[^\]]*\]\(([^)\s]+)\)\s*$/gm)) {
    if (match[1]) urls.add(match[1])
  }
  if (!urls.size) return []
  return getDb().select({
    url: mediaAssets.url, title: mediaAssets.imageTitle, alt: mediaAssets.alt, caption: mediaAssets.caption,
    description: mediaAssets.description, width: mediaAssets.width, height: mediaAssets.height,
  }).from(mediaAssets).where(inArray(mediaAssets.url, [...urls]))
}

export async function getMediaAsset(id: string) {
  const [row] = await getDb().select().from(mediaAssets).where(eq(mediaAssets.id, id))
  return row
}

/** Slot keys that show this image; the image cannot be deleted while any remain. */
export async function slotsUsingAsset(id: string) {
  const rows = await getDb().select({ key: mediaSlots.key }).from(mediaSlots).where(eq(mediaSlots.assetId, id))
  return rows.map((r) => r.key)
}

export async function deleteMediaAsset(id: string) {
  const [row] = await getDb().delete(mediaAssets).where(eq(mediaAssets.id, id)).returning()
  return row
}

export async function getAssetsByIds(ids: string[]) {
  if (!ids.length) return []
  return getDb().select().from(mediaAssets).where(inArray(mediaAssets.id, ids))
}

/** Applies a page's image picks in one batch: a null asset clears the slot back to its default. */
export async function saveMediaSlots(
  changes: { key: string; assetId: string | null; alt: string }[],
  updatedBy: string,
) {
  const db = getDb()
  const statements = changes.map((c) =>
    c.assetId === null
      ? db.delete(mediaSlots).where(eq(mediaSlots.key, c.key))
      : db
          .insert(mediaSlots)
          .values({ key: c.key, assetId: c.assetId, alt: c.alt, updatedBy })
          .onConflictDoUpdate({ target: mediaSlots.key, set: { assetId: c.assetId, alt: c.alt, updatedBy } }),
  )
  const [first, ...rest] = statements
  if (!first) return
  // One batch = one transaction on Neon's HTTP driver.
  await db.batch([first, ...rest])
}
