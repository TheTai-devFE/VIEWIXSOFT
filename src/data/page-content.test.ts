import { describe, expect, it } from 'vitest'
import { ADMIN_PAGES } from '~/data/admin-pages'
import { pageDefaults, resolvePageContent } from '~/data/page-content'
import { PageOverrideSchema } from '~/lib/admin-schemas'
import { buildTitle, DESCRIPTION_MAX, TITLE_MAX } from '~/lib/seo/meta'

describe('page defaults', () => {
  it.each(ADMIN_PAGES.map((p) => [p.key] as const))('%s has defaults within the SEO limits', (key) => {
    const d = pageDefaults(key)
    expect(d).not.toBeNull()
    if (!d) return
    expect(buildTitle(d.seo.title).length).toBeLessThanOrEqual(TITLE_MAX)
    expect(d.seo.description.length).toBeLessThanOrEqual(DESCRIPTION_MAX)
    expect(d.hero.title.length).toBeGreaterThan(0)
  })

  it('follows the product release status', () => {
    expect(pageDefaults('product-pos', { pos: 'coming-soon' })?.seo.title).toBe('Viewixsoft POS: coming soon')
    expect(pageDefaults('product-pos', { pos: 'available' })?.seo.title).not.toContain('coming soon')
  })

  it('returns null for an unknown page', () => {
    expect(pageDefaults('nope')).toBeNull()
  })
})

describe('resolvePageContent', () => {
  const defaults = { seo: { title: 'Default title', description: 'Default description' }, hero: { title: 'Hero', highlight: 'part' } }

  it('applies only the fields that are filled in', () => {
    const out = resolvePageContent(defaults, { heroTitle: 'New hero', seoDescription: '  ', heroHighlight: null })
    expect(out.hero).toEqual({ eyebrow: undefined, title: 'New hero', highlight: 'part', description: undefined })
    expect(out.seo).toEqual({ title: 'Default title', description: 'Default description' })
  })

  it('returns the defaults with no override', () => {
    expect(resolvePageContent(defaults, undefined)).toBe(defaults)
  })
})

describe('PageOverrideSchema', () => {
  const base = { key: 'home', heroEyebrow: '', heroTitle: '', heroHighlight: '', heroDescription: '', seoTitle: '', seoDescription: '' }

  it('turns empty fields into null (use the default)', () => {
    const out = PageOverrideSchema.parse({ ...base, heroTitle: '  Run every screen  ' })
    expect(out.heroTitle).toBe('Run every screen')
    expect(out.seoTitle).toBeNull()
  })

  it('rejects HTML and a misspelled brand', () => {
    expect(PageOverrideSchema.safeParse({ ...base, heroTitle: 'Hi <script>' }).success).toBe(false)
    expect(PageOverrideSchema.safeParse({ ...base, heroTitle: 'Meet viewixsoft today' }).success).toBe(false)
    expect(PageOverrideSchema.safeParse({ ...base, heroTitle: 'Meet Viewixsoft today' }).success).toBe(true)
  })

  it('enforces the search title and description limits', () => {
    expect(PageOverrideSchema.safeParse({ ...base, seoTitle: 'x'.repeat(50) }).success).toBe(false)
    expect(PageOverrideSchema.safeParse({ ...base, seoTitle: 'Digital signage software' }).success).toBe(true)
    expect(PageOverrideSchema.safeParse({ ...base, seoDescription: 'Too short' }).success).toBe(false)
  })

  it('only accepts known pages', () => {
    expect(PageOverrideSchema.safeParse({ ...base, key: 'admin' }).success).toBe(false)
  })
})
