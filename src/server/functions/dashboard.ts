import { createServerFn } from '@tanstack/react-start'
import { readDashboard } from '~/server/admin/dashboard'
import { getEnv } from '~/server/env'
import { adminMiddleware } from '~/server/functions/admin-middleware'
import { errorFields, logger } from '~/server/logger'
import { systemStatus } from '~/server/site/system-status'

export const getDashboardFn = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () => {
    const system = systemStatus(getEnv())
    try {
      return { ok: true as const, data: await readDashboard(), system }
    } catch (error) {
      logger.error('admin.dashboard_failed', errorFields(error))
      return { ok: false as const, system }
    }
  })
