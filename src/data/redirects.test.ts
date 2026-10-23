import { describe, expect, it } from 'vitest'
import { USE_CASES } from '~/content/useCases'
import { REDIRECTS, redirectFor } from '~/data/redirects'

describe('redirects', () => {
  it('send removed use cases and their Markdown twins to the index', () => {
    expect(redirectFor('/use-cases/transportation')).toBe('/use-cases')
    expect(redirectFor('/use-cases/dooh-advertising.md')).toBe('/use-cases')
    expect(redirectFor('/use-cases/retail')).toBeNull()
  })

  it('never redirect a page that still exists, and never chain', () => {
    const live = new Set(USE_CASES.map((u) => `/use-cases/${u.slug}`))
    for (const [from, to] of Object.entries(REDIRECTS)) {
      expect(live.has(from), from).toBe(false)
      expect(REDIRECTS[to], `${from} → ${to}`).toBeUndefined()
    }
  })
})
