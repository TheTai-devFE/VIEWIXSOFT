import { describe, expect, it } from 'vitest'
import { BLOG_POSTS } from '~/content/blog'
import { blogPostSeo, clampDescription, useCaseSeo } from '~/lib/seo/page-seo'

const long =
  'Digital signage software lets one team run every screen from a browser. This guide covers setup, costs and the mistakes we see most often when chains roll out hundreds of screens at once.'

describe('clampDescription', () => {
  it('keeps a description that fits', () => {
    expect(clampDescription('Short and clear.')).toBe('Short and clear.')
  })

  it('ends on a full sentence when one fits', () => {
    expect(clampDescription(long)).toBe('Digital signage software lets one team run every screen from a browser.')
  })

  it('otherwise cuts at a word and adds an ellipsis', () => {
    const out = clampDescription('word '.repeat(60).trim())
    expect(out.length).toBeLessThanOrEqual(155)
    expect(out.endsWith('…')).toBe(true)
    expect(out).not.toMatch(/\s…$/)
  })
})

describe('search snippets', () => {
  const base = BLOG_POSTS[0]
  if (!base) throw new Error('These tests need at least one bundled post')

  it('uses the SEO description from the admin when there is one', () => {
    expect(blogPostSeo({ ...base, seoDescription: 'Custom snippet.' }).description).toBe('Custom snippet.')
  })

  it('shortens a long summary instead of letting Google cut it', () => {
    expect(blogPostSeo({ ...base, description: long }).description.length).toBeLessThanOrEqual(155)
  })

  it('shortens a long case study summary too', () => {
    expect(useCaseSeo({ seoTitle: 'T', tagline: long }).description.length).toBeLessThanOrEqual(155)
  })
})
