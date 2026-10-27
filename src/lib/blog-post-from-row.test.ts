import { describe, expect, it } from 'vitest'
import { shortTitle } from '~/lib/blog-post-from-row'

describe('shortTitle', () => {
  it('keeps a title that already fits', () => {
    expect(shortTitle('Digital menu boards for restaurants')).toBe('Digital menu boards for restaurants')
  })

  it('cuts a long title at a word boundary, not mid-word', () => {
    const t = shortTitle('How to manage hundreds of digital signage screens across many store locations')
    expect(t.length).toBeLessThanOrEqual(47)
    expect('How to manage hundreds of digital signage screens across many store locations'.startsWith(t)).toBe(true)
    expect(t.endsWith(' ')).toBe(false)
    expect(t).toBe('How to manage hundreds of digital signage')
  })

  it('drops a trailing dash or colon left by the cut', () => {
    expect(shortTitle('Digital signage software: a complete buying guide for retail chains in 2026')).toBe(
      'Digital signage software: a complete buying',
    )
  })
})
