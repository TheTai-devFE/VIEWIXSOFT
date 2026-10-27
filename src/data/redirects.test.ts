import { describe, expect, it } from 'vitest'
import { USE_CASES } from '~/content/useCases'
import { REDIRECTS, redirectFor } from '~/data/redirects'

describe('redirects', () => {
  it('send removed use cases and their Markdown twins to the index', () => {
    expect(redirectFor('/use-cases')).toBe('/case-studies')
    expect(redirectFor('/use-cases/transportation')).toBe('/case-studies')
    expect(redirectFor('/use-cases/dooh-advertising.md')).toBe('/case-studies')
  })

  it('never redirect a page that still exists, and never chain', () => {
    const live = new Set(USE_CASES.map((u) => `/case-studies/${u.slug}`))
    for (const [from, to] of Object.entries(REDIRECTS)) {
      expect(live.has(from), from).toBe(false)
      expect(REDIRECTS[to], `${from} → ${to}`).toBeUndefined()
    }
  })
})
