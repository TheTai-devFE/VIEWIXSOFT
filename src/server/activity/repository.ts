import '@tanstack/react-start/server-only'
import { and, count, desc, eq, gte, ilike, lt, or } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { ACTIVITY_PAGE_SIZE, ACTIVITY_RETENTION_DAYS } from '~/lib/activity'
import type { ActivityAction, ActivityEntity, ActivitySearch } from '~/lib/activity'
import { getDb } from '~/server/db/client'
import { activityLog } from '~/server/db/schema'
import { errorFields, logger } from '~/server/logger'

export interface Actor {
  userId: string
  name: string
}

export interface ActivityTarget {
  type: ActivityEntity
  id?: string | null
  label?: string | null
}

/**
 * Records one admin action. Never throws: a failed log line must not undo
 * or block the change it describes.
 */
export async function logActivity(actor: Actor | null, action: ActivityAction, target: ActivityTarget) {
  try {
    await getDb()
      .insert(activityLog)
      .values({
        actorId: actor?.userId ?? null,
        actorName: actor?.name ?? 'Không rõ',
        action,
        entityType: target.type,
        entityId: target.id ?? null,
        entityLabel: target.label?.slice(0, 200) ?? null,
      })
  } catch (error) {
    logger.error('activity.log_failed', { action, ...errorFields(error) })
  }
}

const dayStart = (day: string) => new Date(`${day}T00:00:00.000Z`)

function filters(search: ActivitySearch): SQL | undefined {
  const where: (SQL | undefined)[] = []
  if (search.actor) where.push(eq(activityLog.actorId, search.actor))
  if (search.entity) where.push(eq(activityLog.entityType, search.entity))
  if (search.from) where.push(gte(activityLog.createdAt, dayStart(search.from)))
  if (search.to) {
    const end = dayStart(search.to)
    end.setUTCDate(end.getUTCDate() + 1)
    where.push(lt(activityLog.createdAt, end))
  }
  if (search.q) {
    const like = `%${search.q.replace(/[%_\\]/g, '\\$&')}%`
    where.push(or(ilike(activityLog.entityLabel, like), ilike(activityLog.actorName, like)))
  }
  return where.length ? and(...where) : undefined
}

export async function listActivity(search: ActivitySearch) {
  const page = search.page ?? 1
  const where = filters(search)
  const [rows, [total]] = await Promise.all([
    getDb()
      .select()
      .from(activityLog)
      .where(where)
      .orderBy(desc(activityLog.createdAt))
      .limit(ACTIVITY_PAGE_SIZE)
      .offset((page - 1) * ACTIVITY_PAGE_SIZE),
    getDb().select({ n: count() }).from(activityLog).where(where),
  ])
  return { rows, total: total?.n ?? 0, page, pageSize: ACTIVITY_PAGE_SIZE }
}

/** Drops entries past the retention window; run whenever the log is opened. */
export async function pruneActivity(now = new Date()) {
  const cutoff = new Date(now.getTime() - ACTIVITY_RETENTION_DAYS * 24 * 60 * 60 * 1000)
  await getDb().delete(activityLog).where(lt(activityLog.createdAt, cutoff))
}
