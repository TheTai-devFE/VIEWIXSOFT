import '@tanstack/react-start/server-only'
import { desc, eq } from 'drizzle-orm'
import { getDb } from '~/server/db/client'
import { newsletterSubscribers } from '~/server/db/schema'

export async function listSubscribers(limit = 5000) {
  return getDb().select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt)).limit(limit)
}

export async function setSubscriberStatus(id: string, status: 'active' | 'unsubscribed') {
  const [row] = await getDb()
    .update(newsletterSubscribers)
    .set({ status, ...(status === 'active' ? {} : { confirmedAt: null }) })
    .where(eq(newsletterSubscribers.id, id))
    .returning()
  return row
}

export async function deleteSubscriber(id: string) {
  const [row] = await getDb().delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, id)).returning({ id: newsletterSubscribers.id })
  return Boolean(row)
}
