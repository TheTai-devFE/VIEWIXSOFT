import { createServerFn } from '@tanstack/react-start'
import { ActivitySearchSchema } from '~/lib/activity'
import { listActivity, pruneActivity } from '~/server/activity/repository'
import { requirePermission } from '~/server/functions/admin-middleware'
import { errorFields, logger } from '~/server/logger'
import { listAccountNames } from '~/server/users/repository'

export const listActivityFn = createServerFn({ method: 'GET' })
  .middleware([requirePermission('activity')])
  .validator((data: unknown) => ActivitySearchSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      // Opening the log is when old entries are cleared; there is no scheduled job for it.
      await pruneActivity().catch((error: unknown) => logger.error('activity.prune_failed', errorFields(error)))
      const [result, people] = await Promise.all([listActivity(data), listAccountNames()])
      return { ok: true as const, ...result, people }
    } catch (error) {
      logger.error('admin.activity_list_failed', errorFields(error))
      return { ok: false as const, rows: [], total: 0, page: 1, pageSize: 50, people: [] }
    }
  })
