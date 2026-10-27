import { describe, expect, it, vi } from 'vitest'

vi.mock('~/server/auth', () => ({ getAdminSession: vi.fn() }))

const { assertAccess, ForbiddenError, UnauthorizedError } = await import('~/server/functions/admin-middleware')
const { checkAccountChange } = await import('~/server/users/rules')

const session = (role: 'admin' | 'user', permissions: ('blog' | 'leads')[] = []) => ({
  userId: 'u1',
  email: 'a@example.com',
  name: 'A',
  role,
  permissions,
})

describe('assertAccess', () => {
  it('refuses signed-out requests', () => {
    expect(() => assertAccess(null, ['blog'])).toThrow(UnauthorizedError)
  })

  it('refuses a member without the module', () => {
    expect(() => assertAccess(session('user', ['blog']), ['leads'])).toThrow(ForbiddenError)
  })

  it('allows a member with the module', () => {
    expect(assertAccess(session('user', ['blog']), ['leads', 'blog']).userId).toBe('u1')
  })

  it('keeps admin-only functions for admins', () => {
    expect(() => assertAccess(session('user', ['blog', 'leads']), 'admin')).toThrow(ForbiddenError)
    expect(assertAccess(session('admin'), 'admin').role).toBe('admin')
  })

  it('lets any signed-in account through when no module is named', () => {
    expect(assertAccess(session('user'), []).userId).toBe('u1')
  })
})

describe('checkAccountChange', () => {
  const target = { id: 'u2', role: 'admin' as const, banned: false }

  it('refuses changes to your own account', () => {
    expect(checkAccountChange({ actorId: 'u2', target, activeAdmins: 3 })).toBe('self')
  })

  it('keeps the last working admin', () => {
    expect(checkAccountChange({ actorId: 'u1', target, activeAdmins: 1 })).toBe('last_admin')
  })

  it('allows it when another admin remains, or the target is a member or already locked', () => {
    expect(checkAccountChange({ actorId: 'u1', target, activeAdmins: 2 })).toBeNull()
    expect(checkAccountChange({ actorId: 'u1', target: { ...target, role: 'user' }, activeAdmins: 1 })).toBeNull()
    expect(checkAccountChange({ actorId: 'u1', target: { ...target, banned: true }, activeAdmins: 1 })).toBeNull()
  })
})
