import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { deleteSubscriber, listSubscribers, setSubscriberStatus } from '~/server/admin/subscribers'
import { requirePermission } from '~/server/functions/admin-middleware'
import { errorFields, logger } from '~/server/logger'
import { logActivity } from '~/server/activity/repository'

type Result = { ok: true } | { ok: false; error: string }

export const listSubscribersFn = createServerFn({ method: 'GET' })
  .middleware([requirePermission('subscribers')])
  .handler(async () => {
    try {
      return { ok: true as const, subscribers: await listSubscribers() }
    } catch (error) {
      logger.error('admin.subscribers_failed', errorFields(error))
      return { ok: false as const, subscribers: [] }
    }
  })

export const setSubscriberStatusFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('subscribers')])
  .validator((data: unknown) => z.object({ id: z.string().uuid(), status: z.enum(['active', 'unsubscribed']) }).parse(data))
  .handler(async ({ data, context }): Promise<Result> => {
    const row = await setSubscriberStatus(data.id, data.status)
    // The id only: subscriber emails stay out of the log.
    if (row) await logActivity(context.admin, 'subscriber.status', { type: 'subscriber', id: data.id, label: data.status })
    return row ? { ok: true } : { ok: false, error: 'This subscriber no longer exists.' }
  })

/** Erasure request: removes the address entirely. */
export const deleteSubscriberFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('subscribers')])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<Result> => {
    const removed = await deleteSubscriber(data.id)
    if (removed) {
      logger.info('admin.subscriber_deleted', { by: context.admin.userId })
      await logActivity(context.admin, 'subscriber.delete', { type: 'subscriber', id: data.id })
    }
    return removed ? { ok: true } : { ok: false, error: 'This subscriber no longer exists.' }
  })
