import '@tanstack/react-start/server-only'
import { and, count, desc, eq, gte, sql } from 'drizzle-orm'
import { getDb } from '~/server/db/client'
import type { Database } from '~/server/db/client'
import { leads, newsletterSubscribers } from '~/server/db/schema'
import type { Lead } from '~/server/db/schema'
import type { LeadDeps, NewsletterDeps } from '~/server/leads/process'

export const countRecentLeads: LeadDeps['countRecent'] = async ({ ipHash, email, since }) => {
  const db = getDb()
  const [byEmail] = await db
    .select({ n: count() })
    .from(leads)
    .where(and(eq(leads.email, email), gte(leads.createdAt, since)))
  const [byIp] = ipHash
    ? await db.select({ n: count() }).from(leads).where(and(eq(leads.ipHash, ipHash), gte(leads.createdAt, since)))
    : [{ n: 0 }]
  return { byIp: byIp?.n ?? 0, byEmail: byEmail?.n ?? 0 }
}

export const insertLead: LeadDeps['insertLead'] = async (lead) => {
  const [row] = await getDb()
    .insert(leads)
    .values({
      type: lead.type,
      name: lead.name,
      email: lead.email,
      company: lead.company,
      jobTitle: lead.jobTitle,
      country: lead.country,
      phone: lead.phone,
      companySize: lead.companySize,
      screenCount: lead.screenCount,
      products: lead.products,
      message: lead.message,
      consent: lead.consent,
      consentAt: lead.consentAt,
      utmSource: lead.utmSource,
      utmMedium: lead.utmMedium,
      utmCampaign: lead.utmCampaign,
      utmTerm: lead.utmTerm,
      utmContent: lead.utmContent,
      referrer: lead.referrer,
      landingPage: lead.landingPage,
      ipHash: lead.ipHash,
      userAgent: lead.userAgent,
    })
    .returning({ id: leads.id })
  if (!row) throw new Error('Lead insert returned no row')
  return row
}

/**
 * Insert, or merge topics into an existing address. The merge reads the new
 * topics from `excluded` (the row being inserted): a JS array inside sql``
 * expands to ($1, $2), which Postgres cannot cast to text[].
 */
export function subscriberUpsert(db: Database, { email, topics, consentAt }: Parameters<NewsletterDeps['upsertSubscriber']>[0]) {
  return db
    .insert(newsletterSubscribers)
    .values({ email, topics, consentAt })
    .onConflictDoUpdate({
      target: newsletterSubscribers.email,
      set: {
        // Merge topics without duplicates; an unsubscribed address starts over as pending.
        topics: sql`array(select distinct unnest(${newsletterSubscribers.topics} || excluded.topics))`,
        status: sql`case when ${newsletterSubscribers.status} = 'unsubscribed' then 'pending' else ${newsletterSubscribers.status} end`,
        consentAt,
      },
    })
    .returning({ status: newsletterSubscribers.status })
}

export const upsertSubscriber: NewsletterDeps['upsertSubscriber'] = async (input) => {
  const [row] = await subscriberUpsert(getDb(), input)
  return { needsConfirmation: row?.status !== 'active' }
}

export async function confirmSubscriber(email: string) {
  const [row] = await getDb()
    .update(newsletterSubscribers)
    .set({ status: 'active', confirmedAt: new Date() })
    .where(eq(newsletterSubscribers.email, email))
    .returning({ id: newsletterSubscribers.id })
  return Boolean(row)
}

export async function listLeads(limit = 1000): Promise<Lead[]> {
  return getDb().select().from(leads).orderBy(desc(leads.createdAt)).limit(limit)
}

export async function updateLead(id: string, patch: { status: Lead['status']; notes?: string }) {
  const [row] = await getDb()
    .update(leads)
    .set({ status: patch.status, notes: patch.notes ?? null })
    .where(eq(leads.id, id))
    .returning()
  return row
}

export async function deleteLeadsByEmail(email: string) {
  const db = getDb()
  const removed = await db.delete(leads).where(eq(leads.email, email)).returning({ id: leads.id })
  await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.email, email))
  return removed.length
}
