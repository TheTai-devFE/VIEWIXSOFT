import { describe, expect, it } from 'vitest'
import { toStatusBreakdown } from './stats'

describe('toStatusBreakdown', () => {
  it('fills every status with zero by default, in order', () => {
    expect(Object.keys(toStatusBreakdown([]))).toEqual(['new', 'contacted', 'qualified', 'won', 'lost', 'spam'])
    expect(Object.values(toStatusBreakdown([])).every((n) => n === 0)).toBe(true)
  })

  it('maps counts and ignores unknown statuses', () => {
    const out = toStatusBreakdown([
      { status: 'new', n: 4 },
      { status: 'won', n: 1 },
      { status: 'archived', n: 9 },
    ])
    expect(out).toMatchObject({ new: 4, won: 1, contacted: 0 })
    expect(Object.values(out).reduce((a, b) => a + b, 0)).toBe(5)
  })
})
