import type { Role } from '~/lib/permissions'

export type AccountChangeError = 'self' | 'last_admin'

/**
 * Guards demoting, locking and deleting an account so there is always a
 * working admin: nobody can do these to their own account, or to the last
 * admin who can still sign in.
 */
export function checkAccountChange(input: {
  actorId: string
  target: { id: string; role: Role; banned: boolean }
  /** Admins who are not locked, the target included. */
  activeAdmins: number
}): AccountChangeError | null {
  const { actorId, target, activeAdmins } = input
  if (target.id === actorId) return 'self'
  if (target.role === 'admin' && !target.banned && activeAdmins <= 1) return 'last_admin'
  return null
}
