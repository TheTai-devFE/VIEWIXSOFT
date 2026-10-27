import { describe, expect, it, vi } from 'vitest'

const values = vi.fn()
vi.mock('~/server/db/client', () => ({ getDb: () => ({ insert: () => ({ values }) }) }))
const error = vi.fn()
vi.mock('~/server/logger', () => ({ logger: { error }, errorFields: () => ({}) }))

const { logActivity } = await import('~/server/activity/repository')

describe('logActivity', () => {
  it('stores the actor, action and a trimmed label', async () => {
    values.mockResolvedValueOnce(undefined)
    await logActivity({ userId: 'u1', name: 'Linh' }, 'blog.publish', { type: 'blog', id: 'p1', label: 'x'.repeat(300) })
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'u1', actorName: 'Linh', action: 'blog.publish', entityType: 'blog', entityId: 'p1' }),
    )
    expect(values.mock.calls[0]?.[0].entityLabel).toHaveLength(200)
  })

  it('never throws when the database write fails', async () => {
    values.mockRejectedValueOnce(new Error('db down'))
    await expect(logActivity(null, 'auth.sign_in', { type: 'auth' })).resolves.toBeUndefined()
    expect(error).toHaveBeenCalledWith('activity.log_failed', expect.objectContaining({ action: 'auth.sign_in' }))
  })
})
