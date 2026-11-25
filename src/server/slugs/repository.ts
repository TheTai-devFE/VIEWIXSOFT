import '@tanstack/react-start/server-only'
import { asc, desc, eq } from 'drizzle-orm'
import { getDb } from '~/server/db/client'
import { pageSlugs, urlRedirects } from '~/server/db/schema'

export async function listPageSlugs() {
  return getDb().select().from(pageSlugs).orderBy(asc(pageSlugs.pageKey))
}

export async function getPageSlugByKey(pageKey: string) {
  const [row] = await getDb().select().from(pageSlugs).where(eq(pageSlugs.pageKey, pageKey)).limit(1)
  return row ?? null
}

export async function upsertPageSlug(pageKey: string, defaultPath: string, customPath: string, by: string) {
  await getDb()
    .insert(pageSlugs)
    .values({ pageKey, defaultPath, customPath, updatedBy: by })
    .onConflictDoUpdate({
      target: pageSlugs.pageKey,
      set: { customPath, updatedBy: by },
    })
}

export async function deletePageSlug(pageKey: string) {
  await getDb().delete(pageSlugs).where(eq(pageSlugs.pageKey, pageKey))
}

export async function listUrlRedirects() {
  return getDb().select().from(urlRedirects).orderBy(desc(urlRedirects.createdAt))
}

/**
 * Records a 301 redirect `fromPath -> toPath` while preventing chains and loops:
 * - Removes any existing redirect starting at `toPath` (since `toPath` is now live).
 * - Flattens any existing redirect ending at `fromPath` to point straight to `toPath`.
 * - Upserts `fromPath -> toPath`.
 */
export async function recordUrlRedirect(fromPath: string, toPath: string, by: string) {
  if (fromPath === toPath) return
  const db = getDb()
  await db.batch([
    db.delete(urlRedirects).where(eq(urlRedirects.fromPath, toPath)),
    db.update(urlRedirects).set({ toPath }).where(eq(urlRedirects.toPath, fromPath)),
    db
      .insert(urlRedirects)
      .values({ fromPath, toPath, createdBy: by })
      .onConflictDoUpdate({
        target: urlRedirects.fromPath,
        set: { toPath, createdBy: by },
      }),
  ])
}

export async function removeRedirectFrom(fromPath: string) {
  await getDb().delete(urlRedirects).where(eq(urlRedirects.fromPath, fromPath))
}

export async function deleteUrlRedirect(id: string) {
  const [deleted] = await getDb().delete(urlRedirects).where(eq(urlRedirects.id, id)).returning()
  return deleted ?? null
}
