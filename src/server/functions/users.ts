import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { PasswordSchema, UserCreateSchema, UserUpdateSchema } from '~/lib/admin-schemas'
import { getAuth } from '~/server/auth'
import { requireAdminRole } from '~/server/functions/admin-middleware'
import { errorFields, logger } from '~/server/logger'
import { logActivity } from '~/server/activity/repository'
import { listAuthors } from '~/server/authors/repository'
import { countActiveAdmins, getAccount, listAccounts, updateAccount } from '~/server/users/repository'
import { checkAccountChange } from '~/server/users/rules'
import type { AccountChangeError } from '~/server/users/rules'

// Messages are admin UI copy, so they are in Vietnamese (AGENTS.md §0.6).
const FAILED = 'Không lưu được. Nếu lỗi lặp lại, kiểm tra log server (có thể database chưa chạy migration mới: pnpm db:migrate).'
const NOT_FOUND = 'Không tìm thấy tài khoản này.'
const EMAIL_TAKEN = 'Email này đã có tài khoản.'
const GUARD: Record<AccountChangeError, string> = {
  self: 'Bạn không thể làm việc này với chính tài khoản của mình.',
  last_admin: 'Đây là quản trị viên cuối cùng còn hoạt động. Hãy cấp quyền quản trị cho người khác trước.',
}

type Result = { ok: true } | { ok: false; error: string }

const UserIdSchema = z.object({ userId: z.string().min(1) })

/** Better Auth's admin endpoints check the caller's role again from these headers. */
const headers = () => getRequest().headers

async function guard(actorId: string, userId: string): Promise<Result> {
  const target = await getAccount(userId)
  if (!target) return { ok: false, error: NOT_FOUND }
  const problem = checkAccountChange({ actorId, target, activeAdmins: await countActiveAdmins() })
  return problem ? { ok: false, error: GUARD[problem] } : { ok: true }
}

async function run(event: string, fn: () => Promise<Result | void>): Promise<Result> {
  try {
    const result = await fn()
    if (result && !result.ok) return result
    logger.info(event)
    return { ok: true }
  } catch (error) {
    logger.error(`${event}_failed`, errorFields(error))
    return { ok: false, error: FAILED }
  }
}

export const listUsersFn = createServerFn({ method: 'GET' })
  .middleware([requireAdminRole])
  .handler(async ({ context }) => {
    try {
      const [users, authors] = await Promise.all([listAccounts(), listAuthors()])
      // Which author profile each account writes as, for the account cards.
      const authorByUser = Object.fromEntries(authors.flatMap((a) => (a.userId ? [[a.userId, a.name]] : [])))
      return { ok: true as const, users, authorByUser, currentUserId: context.admin.userId }
    } catch (error) {
      logger.error('admin.users_list_failed', errorFields(error))
      return { ok: false as const, users: [], authorByUser: {}, currentUserId: context.admin.userId }
    }
  })

export const createUserFn = createServerFn({ method: 'POST' })
  .middleware([requireAdminRole])
  .validator((data: unknown) => UserCreateSchema.parse(data))
  .handler(({ data, context }) =>
    run('admin.user_created', async () => {
      const existing = (await listAccounts()).some((u) => u.email === data.email)
      if (existing) return { ok: false, error: EMAIL_TAKEN }
      const created = await getAuth().api.createUser({
        body: { email: data.email, password: data.password, name: data.name, role: data.role },
        headers: headers(),
      })
      await updateAccount(created.user.id, data)
      await logActivity(context.admin, 'user.create', { type: 'user', id: created.user.id, label: data.name })
    }),
  )

export const updateUserFn = createServerFn({ method: 'POST' })
  .middleware([requireAdminRole])
  .validator((data: unknown) => UserUpdateSchema.parse(data))
  .handler(({ data, context }) =>
    run('admin.user_updated', async () => {
      const target = await getAccount(data.userId)
      if (!target) return { ok: false, error: NOT_FOUND }
      if (target.role === 'admin' && data.role !== 'admin') {
        const allowed = await guard(context.admin.userId, data.userId)
        if (!allowed.ok) return allowed
      }
      await updateAccount(data.userId, data)
      await logActivity(context.admin, 'user.update', {
        type: 'user',
        id: data.userId,
        label: `${data.name} (${data.role === 'admin' ? 'Quản trị viên' : `Thành viên: ${data.permissions.length} quyền`})`,
      })
    }),
  )

export const setUserPasswordFn = createServerFn({ method: 'POST' })
  .middleware([requireAdminRole])
  .validator((data: unknown) => UserIdSchema.extend({ password: PasswordSchema }).parse(data))
  .handler(({ data, context }) =>
    run('admin.user_password_set', async () => {
      const target = await getAccount(data.userId)
      if (!target) return { ok: false, error: NOT_FOUND }
      await getAuth().api.setUserPassword({ body: { userId: data.userId, newPassword: data.password }, headers: headers() })
      // Whoever knew the old password is signed out everywhere.
      await getAuth().api.revokeUserSessions({ body: { userId: data.userId }, headers: headers() })
      await logActivity(context.admin, 'user.password', { type: 'user', id: target.id, label: target.name })
    }),
  )

export const setUserBannedFn = createServerFn({ method: 'POST' })
  .middleware([requireAdminRole])
  .validator((data: unknown) => UserIdSchema.extend({ banned: z.boolean() }).parse(data))
  .handler(({ data, context }) =>
    run(data.banned ? 'admin.user_banned' : 'admin.user_unbanned', async () => {
      const target = await getAccount(data.userId)
      if (!target) return { ok: false, error: NOT_FOUND }
      if (!data.banned) {
        await getAuth().api.unbanUser({ body: { userId: data.userId }, headers: headers() })
        await logActivity(context.admin, 'user.unban', { type: 'user', id: target.id, label: target.name })
        return
      }
      const allowed = await guard(context.admin.userId, data.userId)
      if (!allowed.ok) return allowed
      // Locking also ends the account's sessions.
      await getAuth().api.banUser({ body: { userId: data.userId }, headers: headers() })
      await logActivity(context.admin, 'user.ban', { type: 'user', id: target.id, label: target.name })
    }),
  )

export const revokeUserSessionsFn = createServerFn({ method: 'POST' })
  .middleware([requireAdminRole])
  .validator((data: unknown) => UserIdSchema.parse(data))
  .handler(({ data, context }) =>
    run('admin.user_sessions_revoked', async () => {
      const target = await getAccount(data.userId)
      if (!target) return { ok: false, error: NOT_FOUND }
      await getAuth().api.revokeUserSessions({ body: { userId: data.userId }, headers: headers() })
      await logActivity(context.admin, 'user.sessions', { type: 'user', id: target.id, label: target.name })
    }),
  )

export const deleteUserFn = createServerFn({ method: 'POST' })
  .middleware([requireAdminRole])
  .validator((data: unknown) => UserIdSchema.parse(data))
  .handler(({ data, context }) =>
    run('admin.user_deleted', async () => {
      const target = await getAccount(data.userId)
      const allowed = await guard(context.admin.userId, data.userId)
      if (!allowed.ok) return allowed
      await getAuth().api.removeUser({ body: { userId: data.userId }, headers: headers() })
      await logActivity(context.admin, 'user.delete', { type: 'user', id: data.userId, label: target?.name })
    }),
  )
