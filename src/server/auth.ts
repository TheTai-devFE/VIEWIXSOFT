import '@tanstack/react-start/server-only'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { admin } from 'better-auth/plugins'
import { createAuthMiddleware, getSessionFromCtx } from 'better-auth/api'
import { getRequest } from '@tanstack/react-start/server'
import { getDb } from '~/server/db/client'
import { account, session, user, verification } from '~/server/db/schema'
import { getEnv, requireSecret } from '~/server/env'
import { parsePermissions, parseRole } from '~/lib/permissions'
import { logAuth } from '~/server/logger'
import { logActivity } from '~/server/activity/repository'
import { getAccount } from '~/server/users/repository'

function createAuth() {
  const env = getEnv()
  return betterAuth({
    secret: requireSecret('BETTER_AUTH_SECRET'),
    baseURL: env.BETTER_AUTH_URL ?? env.SITE_URL,
    trustedOrigins: [
      'https://viewixsoft.com',
      'https://www.viewixsoft.com',
      'https://viewixsoft.vercel.app',
      ...(env.BETTER_AUTH_URL ? [env.BETTER_AUTH_URL.replace(/\/$/, '')] : []),
      ...(env.SITE_URL ? [env.SITE_URL.replace(/\/$/, '')] : []),
    ],
    database: drizzleAdapter(getDb(), { provider: 'pg', schema: { user, session, account, verification } }),
    // Accounts are created by an admin in /admin/users or with `pnpm admin:create`; nobody can sign up from the site.
    emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 12 },
    user: {
      additionalFields: {
        // Only an admin changes these, through the server functions in ~/server/functions/users.
        permissions: { type: 'string[]', required: false, input: false, defaultValue: [] },
      },
    },
    // Sign-ins and sign-outs go to /admin/activity next to the changes people make.
    databaseHooks: {
      session: {
        create: {
          after: async (created) => {
            const account = await getAccount(created.userId).catch(() => null)
            const actor = account ? { userId: account.id, name: account.name } : null
            await logActivity(actor, 'auth.sign_in', { type: 'auth', id: created.userId, label: account?.name })
          },
        },
      },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== '/sign-out') return
        const current = await getSessionFromCtx(ctx).catch(() => null)
        if (!current) return
        const actor = { userId: current.user.id, name: current.user.name }
        await logActivity(actor, 'auth.sign_out', { type: 'auth', id: actor.userId, label: actor.name })
      }),
    },
    // Signing in as someone else isn't needed and would blur who changed what.
    disabledPaths: ['/admin/impersonate-user', '/admin/stop-impersonating'],
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    rateLimit: { enabled: true, window: 60, max: 20 },
    advanced: { useSecureCookies: env.NODE_ENV === 'production' },
    plugins: [
      admin({ defaultRole: 'user', adminRoles: ['admin'], bannedUserMessage: 'Tài khoản này đã bị khoá. Liên hệ quản trị viên.' }),
      tanstackStartCookies(),
    ],
    logger: { level: 'warn', log: logAuth },
  })
}

let cached: { key: string; auth: ReturnType<typeof createAuth> } | undefined

/** One Better Auth instance per isolate, rebuilt only if the env changes. */
export function getAuth() {
  const env = getEnv()
  const key = `${env.DATABASE_URL}|${env.BETTER_AUTH_SECRET}|${env.BETTER_AUTH_URL}`
  if (cached?.key !== key) cached = { key, auth: createAuth() }
  return cached.auth
}

export interface AdminSession {
  userId: string
  email: string
  name: string
  role: ReturnType<typeof parseRole>
  permissions: ReturnType<typeof parsePermissions>
}

/** The signed-in account for the current request with its access, or null. */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const result = await getAuth().api.getSession({ headers: getRequest().headers })
    if (!result || result.user.banned) return null
    return {
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: parseRole(result.user.role),
      permissions: parsePermissions(result.user.permissions),
    }
  } catch {
    return null
  }
}
