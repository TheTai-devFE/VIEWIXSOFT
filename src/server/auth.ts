import '@tanstack/react-start/server-only'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { getRequest } from '@tanstack/react-start/server'
import { getDb } from '~/server/db/client'
import { account, session, user, verification } from '~/server/db/schema'
import { getEnv, requireSecret } from '~/server/env'
import { logAuth } from '~/server/logger'

function createAuth() {
  const env = getEnv()
  return betterAuth({
    secret: requireSecret('BETTER_AUTH_SECRET'),
    baseURL: env.BETTER_AUTH_URL ?? env.SITE_URL,
    database: drizzleAdapter(getDb(), { provider: 'pg', schema: { user, session, account, verification } }),
    // Admins are created with `pnpm admin:create`; nobody can sign up from the site.
    emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 12 },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    rateLimit: { enabled: true, window: 60, max: 20 },
    advanced: { useSecureCookies: env.NODE_ENV === 'production' },
    plugins: [tanstackStartCookies()],
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

/** The signed-in admin for the current request, or null. */
export async function getAdminSession() {
  try {
    const result = await getAuth().api.getSession({ headers: getRequest().headers })
    return result ? { userId: result.user.id, email: result.user.email, name: result.user.name } : null
  } catch {
    return null
  }
}
