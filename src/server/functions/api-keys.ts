import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { API_SCOPE_LABELS, CreateApiKeySchema, scopesAllowed } from '~/lib/api-keys'
import { requirePermission } from '~/server/functions/admin-middleware'
import { createApiKey, listApiKeys, revokeApiKey } from '~/server/api-keys/repository'
import { logActivity } from '~/server/activity/repository'
import { errorFields, logger } from '~/server/logger'

/*
 * Keys are personal: an account with the "api-keys" permission makes and
 * revokes its own, carrying at most the Blog/Schema access it has itself.
 * Admins see and revoke every key. The access is checked again on every API
 * request (src/server/api-keys/repository.ts).
 */
// Messages are admin UI copy, so they are in Vietnamese (AGENTS.md §0.6).
const FAILED = 'Không thực hiện được. Nếu lỗi lặp lại, kiểm tra log server (có thể database chưa chạy migration mới: pnpm db:migrate).'

export const getApiKeysFn = createServerFn({ method: 'GET' })
  .middleware([requirePermission('api-keys')])
  .handler(async ({ context }) => {
    const isAdmin = context.admin.role === 'admin'
    const me = { isAdmin, allowedScopes: scopesAllowed(context.admin) }
    try {
      return { ok: true as const, keys: await listApiKeys(isAdmin ? undefined : context.admin.userId), ...me }
    } catch (error) {
      logger.error('admin.api_keys_list_failed', errorFields(error))
      return { ok: false as const, keys: [], ...me }
    }
  })

export const createApiKeyFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('api-keys')])
  .validator((data: unknown) => CreateApiKeySchema.parse(data))
  .handler(async ({ data, context }) => {
    const allowed = scopesAllowed(context.admin)
    const extra = data.scopes.filter((s) => !allowed.includes(s))
    if (extra.length) {
      return { ok: false as const, message: `Tài khoản của bạn không có quyền cấp: ${extra.map((s) => API_SCOPE_LABELS[s].label).join(', ')}.` }
    }
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
  .middleware([requirePermission('api-keys')])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    try {
      // Members revoke only their own keys; admins any key.
      const row = await revokeApiKey(data.id, context.admin.role === 'admin' ? undefined : context.admin.userId)
      if (!row) return { ok: false as const, message: 'Khóa này không tồn tại, đã bị thu hồi, hoặc không phải của bạn.' }
      await logActivity(context.admin, 'api-key.revoke', { type: 'api-key', id: row.id, label: row.name })
      return { ok: true as const }
    } catch (error) {
      logger.error('admin.api_key_revoke_failed', errorFields(error))
      return { ok: false as const, message: FAILED }
    }
  })
