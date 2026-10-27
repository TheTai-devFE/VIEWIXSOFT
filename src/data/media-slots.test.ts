import { describe, expect, it } from 'vitest'
import { ADMIN_PAGES } from '~/data/admin-pages'
import { altFromFileName, MEDIA_SLOTS, MEDIA_SLOT_KEYS, SHARE_IMAGE_SLOT, slotsForPage, slotsForSection } from '~/data/media-slots'
import { SECTION_PAGES } from '~/data/site-sections'
import { SaveMediaSlotsSchema } from '~/lib/admin-schemas'

describe('media slots', () => {
  it('have unique keys', () => {
    expect(new Set(MEDIA_SLOT_KEYS).size).toBe(MEDIA_SLOT_KEYS.length)
  })

  it('each show in at least one known page and section', () => {
    // The link preview image is site-wide and picked in /admin/seo.
    for (const slot of MEDIA_SLOTS.filter((s) => s.key !== SHARE_IMAGE_SLOT)) {
      expect(slot.places.length).toBeGreaterThan(0)
      for (const place of slot.places) {
        const page = ADMIN_PAGES.find((p) => p.key === place.page)
        expect(page, `${slot.key} → ${place.page}`).toBeDefined()
        // A section must exist on that page; pages without sections take slots outside any section.
        const sections: readonly { key: string }[] = page?.sections ? SECTION_PAGES[page.sections].sections : []
        if (place.section) expect(sections.map((s) => s.key), `${slot.key} → ${place.section}`).toContain(place.section)
        else expect(sections).toEqual([])
      }
    }
  })

  it('keep the link preview image off the page editors', () => {
    expect(MEDIA_SLOTS.filter((s) => s.places.length === 0).map((s) => s.key)).toEqual([SHARE_IMAGE_SLOT])
  })

  it('are listed for the pages that show them', () => {
    expect(slotsForPage('use-cases').every((s) => s.group === 'Use case covers')).toBe(true)
    expect(slotsForPage('contact')).toEqual([])
    // Device photos are part of the section's own content now.
    expect(slotsForSection('home', 'devices')).toEqual([])
  })
})

describe('altFromFileName', () => {
  it('turns a file name into readable words', () => {
    expect(altFromFileName('lcd-digital_signage.02.webp')).toBe('Lcd digital signage 02')
  })

  it('falls back when the name says nothing', () => {
    expect(altFromFileName('1.png')).toBe('Uploaded image')
  })
})

describe('SaveMediaSlotsSchema', () => {
  const key = MEDIA_SLOT_KEYS[0] ?? ''
  const id = '6f1c1c7e-0b0c-4e8a-9a51-1f2b3c4d5e6f'

  it('needs alt text for a picked image', () => {
    expect(SaveMediaSlotsSchema.safeParse({ changes: [{ key, assetId: id, alt: 'ab' }] }).success).toBe(false)
    expect(SaveMediaSlotsSchema.safeParse({ changes: [{ key, assetId: id, alt: 'A kiosk' }] }).success).toBe(true)
  })

  it('accepts going back to the default without alt text', () => {
    expect(SaveMediaSlotsSchema.safeParse({ changes: [{ key, assetId: null, alt: '' }] }).success).toBe(true)
  })

  it('rejects unknown slots', () => {
    expect(SaveMediaSlotsSchema.safeParse({ changes: [{ key: 'nope', assetId: null, alt: '' }] }).success).toBe(false)
  })
})
