import { describe, expect, it } from 'vitest'
import { ActivitySearchSchema, describeAction } from '~/lib/activity'
import { statusAction } from '~/server/activity/status-action'

describe('describeAction', () => {
  it('reads as a Vietnamese verb and object', () => {
    expect(describeAction('blog.publish')).toBe('Đăng bài blog')
    expect(describeAction('user.ban')).toBe('Khoá tài khoản')
    expect(describeAction('auth.sign_in')).toBe('Đăng nhập')
  })
})

describe('statusAction', () => {
  it('logs a status change as publish or unpublish, otherwise as an edit', () => {
    expect(statusAction('blog', 'draft', 'published')).toBe('blog.publish')
    expect(statusAction('use-case', 'published', 'draft')).toBe('use-case.unpublish')
    expect(statusAction('blog', 'published', 'published')).toBe('blog.update')
  })
})

describe('ActivitySearchSchema', () => {
  it('drops bad filters instead of failing the page', () => {
    expect(ActivitySearchSchema.parse({ entity: 'billing', from: '27/10/2026', page: -1, actor: 'u1' })).toEqual({
      entity: undefined,
      from: undefined,
      page: undefined,
      actor: 'u1',
    })
  })
})
