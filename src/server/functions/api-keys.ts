import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { CreateApiKeySchema } from '~/lib/api-keys'
import { requireAdminRole } from '~/server/functions/admin-middleware'
import { createApiKey, listApiKeys, revokeApiKey } from '~/server/api-keys/repository'
import { logActivity } from '~/server/activity/repository'
import { errorFields, logger } from '~/server/logger'

// Keys open the site to outside tools, so only admins manage them.
// Messages are admin UI copy, so they are in Vietnamese (AGENTS.md §0.6).
const FAILED = 'Không thực hiện được. Nếu lỗi lặp lại, kiểm tra log server (có thể database chưa chạy migration mới: pnpm db:migrate).'

export const getApiKeysFn = createServerFn({ method: 'GET' })
  .middleware([requireAdminRole])
  .handler(async () => {
    try {
      return { ok: true as const, keys: await listApiKeys() }
    } catch (error) {
      logger.error('admin.api_keys_list_failed', errorFields(error))
      return { ok: false as const, keys: [] }
    }
  })

export const createApiKeyFn = createServerFn({ method: 'POST' })
  .middleware([requireAdminRole])
  .validator((data: unknown) => CreateApiKeySchema.parse(data))
  .handler(async ({ data, context }) => {
    try {
      const { key, row } = await createApiKey(data, context.admin.userId)
      await logActivity(context.admin, 'api-key.create', { type: 'api-key', id: row.id, label: row.name })
      return { ok: true as const, key, row }
    } catch (error) {
      logger.error('admin.api_key_create_failed', errorFields(error))
      return { ok: false as const, message: FAILED }
    }
  })

export const revokeApiKeyFn = createServerFn({ method: 'POST' })
  .middleware([requireAdminRole])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    try {
      const row = await revokeApiKey(data.id)
      if (!row) return { ok: false as const, message: 'Khóa này không tồn tại hoặc đã bị thu hồi.' }
      await logActivity(context.admin, 'api-key.revoke', { type: 'api-key', id: row.id, label: row.name })
      return { ok: true as const }
    } catch (error) {
      logger.error('admin.api_key_revoke_failed', errorFields(error))
      return { ok: false as const, message: FAILED }
    }
  })
