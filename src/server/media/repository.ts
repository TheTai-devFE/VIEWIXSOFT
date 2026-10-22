import '@tanstack/react-start/server-only'
import { eq } from 'drizzle-orm'
import { getDb } from '~/server/db/client'
import { mediaSlots } from '~/server/db/schema'

export async function listMediaSlots() {
  return getDb().select().from(mediaSlots)
}

export async function getMediaSlot(key: string) {
  const [row] = await getDb().select().from(mediaSlots).where(eq(mediaSlots.key, key))
  return row
}

export async function upsertMediaSlot(row: {
  key: string
  url: string
  storageKey: string
  alt: string
  width: number
  height: number
  updatedBy: string
}) {
  const { key, ...rest } = row
  await getDb().insert(mediaSlots).values(row).onConflictDoUpdate({ target: mediaSlots.key, set: rest })
}

export async function updateMediaAlt(key: string, alt: string, updatedBy: string) {
  const [row] = await getDb().update(mediaSlots).set({ alt, updatedBy }).where(eq(mediaSlots.key, key)).returning()
  return row
}

export async function deleteMediaSlot(key: string) {
  const [row] = await getDb().delete(mediaSlots).where(eq(mediaSlots.key, key)).returning()
  return row
}
