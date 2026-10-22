import '@tanstack/react-start/server-only'
import { count, desc, gte, sql } from 'drizzle-orm'
import { getDb } from '~/server/db/client'
import { leads, newsletterSubscribers } from '~/server/db/schema'
import { toStatusBreakdown } from '~/server/admin/stats'
import type { DashboardData } from '~/server/admin/stats'

export async function readDashboard(now = new Date()): Promise<DashboardData> {
  const db = getDb()
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const [byStatus, [recentCount], subs, recent] = await Promise.all([
    db.select({ status: leads.status, n: count() }).from(leads).groupBy(leads.status),
    db.select({ n: count() }).from(leads).where(gte(leads.createdAt, since)),
    db
      .select({ status: newsletterSubscribers.status, n: count() })
      .from(newsletterSubscribers)
      .groupBy(newsletterSubscribers.status),
    db
      .select({
        id: leads.id,
        name: leads.name,
        company: leads.company,
        type: leads.type,
        status: leads.status,
        createdAt: sql<string>`${leads.createdAt}::text`,
      })
      .from(leads)
      .orderBy(desc(leads.createdAt))
      .limit(5),
  ])
  const breakdown = toStatusBreakdown(byStatus)
  const subCount = (s: string) => subs.find((r) => r.status === s)?.n ?? 0
  return {
    leads: {
      total: Object.values(breakdown).reduce((a, b) => a + b, 0),
      newCount: breakdown.new,
      last30Days: recentCount?.n ?? 0,
      byStatus: breakdown,
    },
    subscribers: { active: subCount('active'), pending: subCount('pending'), unsubscribed: subCount('unsubscribed') },
    recent,
  }
}
