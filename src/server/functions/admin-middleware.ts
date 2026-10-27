import { createMiddleware } from '@tanstack/react-start'
import { can } from '~/lib/permissions'
import type { Permission } from '~/lib/permissions'
import { getAdminSession } from '~/server/auth'
import type { AdminSession } from '~/server/auth'

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super('Forbidden')
    this.name = 'ForbiddenError'
  }
}

/**
 * Throws unless the account is signed in and holds one of `needed` (any
 * signed-in account when `needed` is empty; only admins when it is 'admin').
 */
export function assertAccess(session: AdminSession | null, needed: Permission[] | 'admin'): AdminSession {
  if (!session) throw new UnauthorizedError()
  if (needed === 'admin') {
    if (session.role !== 'admin') throw new ForbiddenError()
  } else if (needed.length && !can(session, ...needed)) {
    throw new ForbiddenError()
  }
  return session
}

/** Any signed-in account. Used only by functions every account needs, like its own profile. */
export const adminMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const admin = assertAccess(await getAdminSession(), [])
  return next({ context: { admin } })
})

/** Signed in and allowed to use at least one of the given modules. */
export function requirePermission(...needed: [Permission, ...Permission[]]) {
  return createMiddleware({ type: 'function' }).server(async ({ next }) => {
    const admin = assertAccess(await getAdminSession(), needed)
    return next({ context: { admin } })
  })
}

/** Admins only: managing accounts and access. */
export const requireAdminRole = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const admin = assertAccess(await getAdminSession(), 'admin')
  return next({ context: { admin } })
})
