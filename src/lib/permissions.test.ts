import { describe, expect, it } from 'vitest'
import { canOpen, homeFor, navFor, navItemFor } from '~/components/admin/admin-nav'
import { can, canEditContent, parsePermissions, parseRole } from '~/lib/permissions'
import { UserCreateSchema } from '~/lib/admin-schemas'

const admin = { role: 'admin' as const, permissions: [] }
const marketing = { role: 'user' as const, permissions: ['blog', 'media'] as const }
const nobody = { role: 'user' as const, permissions: [] }

describe('can', () => {
  it('lets admins do everything', () => {
    expect(can(admin, 'leads')).toBe(true)
  })

  it('lets a member use only ticked modules', () => {
    expect(can(marketing, 'blog')).toBe(true)
    expect(can(marketing, 'leads')).toBe(false)
  })

  it('passes when any one of several modules is ticked', () => {
    expect(can(marketing, 'authors', 'blog')).toBe(true)
  })
})

describe('parsing stored values', () => {
  it('drops unknown permissions and treats a missing role as member', () => {
    expect(parsePermissions(['blog', 'billing', 3])).toEqual(['blog'])
    expect(parsePermissions(null)).toEqual([])
    expect(parseRole(null)).toBe('user')
    expect(parseRole('admin')).toBe('admin')
  })
})

describe('admin navigation', () => {
  it('shows a member only their modules and their own account', () => {
    const items = navFor(marketing).flatMap((g) => g.items.map((i) => i.to))
    expect(items).toEqual(['/admin/blog', '/admin/media', '/admin/account'])
  })

  it('maps nested paths to their module', () => {
    expect(navItemFor('/admin/blog/123')?.access).toBe('blog')
    expect(navItemFor('/admin')?.access).toBe('dashboard')
    expect(navItemFor('/admin/users')?.access).toBe('admin')
  })

  it('keeps account management for admins', () => {
    const users = navItemFor('/admin/users')
    if (!users) throw new Error('missing /admin/users')
    expect(canOpen(admin, users)).toBe(true)
    expect(canOpen(marketing, users)).toBe(false)
  })

  it('sends a member to their first module, or to their account when they have none', () => {
    expect(homeFor(marketing)).toBe('/admin/blog')
    expect(homeFor(nobody)).toBe('/admin/account')
    expect(homeFor(admin)).toBe('/admin')
  })
})

describe('UserCreateSchema', () => {
  const base = { name: 'Linh', email: 'Linh@Example.com', password: 'a-long-password-1', role: 'user', permissions: ['blog'] }

  it('normalises the email', () => {
    expect(UserCreateSchema.parse(base).email).toBe('linh@example.com')
  })

  it('rejects short passwords and unknown permissions', () => {
    expect(UserCreateSchema.safeParse({ ...base, password: 'short' }).success).toBe(false)
    expect(UserCreateSchema.safeParse({ ...base, permissions: ['billing'] }).success).toBe(false)
  })
})

describe('canEditContent', () => {
  const writer = { userId: 'u1', role: 'user' as const, permissions: ['blog'] as const }
  const editor = { userId: 'u2', role: 'user' as const, permissions: ['blog', 'edit-others'] as const }

  it('lets the creator change their own post', () => {
    expect(canEditContent(writer, { createdBy: 'u1' })).toBe(true)
  })

  it("keeps someone else's post read-only without edit-others", () => {
    expect(canEditContent(writer, { createdBy: 'u9' })).toBe(false)
    expect(canEditContent(writer, { createdBy: null })).toBe(false)
  })

  it('lets edit-others holders and admins change any post', () => {
    expect(canEditContent(editor, { createdBy: 'u9' })).toBe(true)
    expect(canEditContent({ userId: 'u3', role: 'admin', permissions: [] }, { createdBy: null })).toBe(true)
  })
})
