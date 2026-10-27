import { describe, expect, it } from 'vitest'
import {
  assetIdsIn,
  balancedColumns,
  ContactSectionContentSchema,
  DevicesContentSchema,
  FaqContentSchema,
  HomeHeroContentSchema,
  HowItWorksContentSchema,
  IntroVideoContentSchema,
  resolveSectionContent,
  SECTION_CONTENT,
  SECTION_CONTENT_KEYS,
  sectionContentKey,
} from '~/lib/section-content'

const DEFAULTS = SECTION_CONTENT['home:devices'].defaults
const image = { assetId: '6f1c1c7e-0b0c-4e8a-9a51-1f2b3c4d5e6f', url: '/a.webp', width: 800, height: 800, alt: 'A kiosk' }

describe('section content', () => {
  it('defaults pass their own schema', () => {
    expect(DevicesContentSchema.safeParse(DEFAULTS).success).toBe(true)
  })

  it('falls back to the defaults when nothing or something invalid is stored', () => {
    expect(resolveSectionContent('home:devices', undefined)).toBe(DEFAULTS)
    expect(resolveSectionContent('home:devices', { title: 'x' })).toBe(DEFAULTS)
  })

  it('uses valid stored content as a whole', () => {
    const stored = { ...DEFAULTS, items: [{ id: 'a', name: 'LED screen', brand: '', image }] }
    expect(resolveSectionContent('home:devices', stored).items).toHaveLength(1)
  })

  it('rejects HTML, a misspelled brand and an empty list', () => {
    expect(DevicesContentSchema.safeParse({ ...DEFAULTS, title: 'Hi <b>there</b>' }).success).toBe(false)
    expect(DevicesContentSchema.safeParse({ ...DEFAULTS, title: 'Ready for ViewixSoft' }).success).toBe(false)
    expect(DevicesContentSchema.safeParse({ ...DEFAULTS, items: [] }).success).toBe(false)
  })

  it('only knows the sections listed', () => {
    expect(sectionContentKey('home', 'devices')).toBe('home:devices')
    expect(sectionContentKey('home', 'faq')).toBe('home:faq')
    expect(sectionContentKey('home', 'pricing')).toBeNull()
  })

  it('finds the library images a section uses', () => {
    expect(assetIdsIn({ items: [{ image }, { image }, { image: null }] })).toEqual([image.assetId])
  })
})

describe('home hero partners', () => {
  const logo = { assetId: image.assetId, url: '/logo.webp', width: 400, height: 120 }

  it('defaults pass, and an empty list is allowed (the strip hides)', () => {
    expect(HomeHeroContentSchema.safeParse(SECTION_CONTENT['home:hero'].defaults).success).toBe(true)
    expect(HomeHeroContentSchema.safeParse({ partnersLabel: 'Trusted by', partners: [] }).success).toBe(true)
  })

  it('allows an empty label, which hides it', () => {
    expect(HomeHeroContentSchema.safeParse({ partnersLabel: '', partners: [] }).success).toBe(true)
  })

  it('takes a logo without alt text, since the partner name is its label', () => {
    const content = { partnersLabel: 'Trusted by', partners: [{ id: 'a', name: 'HP', logo }] }
    expect(HomeHeroContentSchema.safeParse(content).success).toBe(true)
  })

  it('needs a name for every partner', () => {
    const content = { partnersLabel: 'Trusted by', partners: [{ id: 'a', name: '', logo }] }
    expect(HomeHeroContentSchema.safeParse(content).success).toBe(false)
  })
})

describe('home FAQ', () => {
  const defaults = SECTION_CONTENT['home:faq'].defaults
  const item = { id: 'a', question: 'What is Viewixsoft CMS?', answer: 'Viewixsoft CMS is cloud software for screens.' }

  it('defaults come from the code FAQ and pass the schema', () => {
    expect(FaqContentSchema.safeParse(defaults).success).toBe(true)
    expect(defaults.items.length).toBeGreaterThan(0)
  })

  it('uses an edited FAQ, so the section, JSON-LD and llms-full.txt all read it', () => {
    const stored = { eyebrow: '', title: 'Common questions', items: [item] }
    expect(resolveSectionContent('home:faq', stored).items).toEqual([item])
  })

  it('needs at least one question, and a question and answer for each', () => {
    expect(FaqContentSchema.safeParse({ ...defaults, items: [] }).success).toBe(false)
    expect(FaqContentSchema.safeParse({ ...defaults, items: [{ ...item, answer: '' }] }).success).toBe(false)
    expect(FaqContentSchema.safeParse({ ...defaults, items: [{ ...item, question: 'Is <b>it</b> free?' }] }).success).toBe(false)
  })
})

describe('how it works', () => {
  const defaults = SECTION_CONTENT['home:how-it-works'].defaults
  const step = { id: 'a', title: 'Connect', description: 'Connect each screen to Wi-Fi.' }

  it('defaults pass the schema', () => {
    expect(HowItWorksContentSchema.safeParse(defaults).success).toBe(true)
  })

  it('takes 2 to 4 steps, which the layout has columns for', () => {
    expect(HowItWorksContentSchema.safeParse({ ...defaults, steps: [step] }).success).toBe(false)
    expect(HowItWorksContentSchema.safeParse({ ...defaults, steps: [step, { ...step, id: 'b' }] }).success).toBe(true)
    const five = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ ...step, id }))
    expect(HowItWorksContentSchema.safeParse({ ...defaults, steps: five }).success).toBe(false)
  })
})

describe('contact section', () => {
  const defaults = SECTION_CONTENT['home:demo-form'].defaults

  it('defaults pass the schema', () => {
    expect(ContactSectionContentSchema.safeParse(defaults).success).toBe(true)
  })

  it('lets the gradient end and the partner text be empty, but needs a heading and button text', () => {
    const hidden = { ...defaults, highlight: '', partner: { ...defaults.partner, show: false, eyebrow: '', description: '' } }
    expect(ContactSectionContentSchema.safeParse(hidden).success).toBe(true)
    expect(ContactSectionContentSchema.safeParse({ ...defaults, title: '' }).success).toBe(false)
    expect(ContactSectionContentSchema.safeParse({ ...defaults, partner: { ...defaults.partner, cta: '' } }).success).toBe(false)
  })

  it('needs at least one next step', () => {
    expect(ContactSectionContentSchema.safeParse({ ...defaults, steps: [] }).success).toBe(false)
  })
})

describe('balancedColumns', () => {
  it.each([
    [1, 1],
    [4, 4],
    [6, 6],
    [7, 4],
    [8, 4],
    [9, 5],
    [10, 5],
    [12, 6],
  ])('%i cards → %i columns', (count, columns) => {
    expect(balancedColumns(count)).toBe(columns)
  })
})

describe('product tour content', () => {
  const defaults = SECTION_CONTENT['product-cms:intro-video'].defaults
  const video = { assetId: '6f1c1c7e-0b0c-4e8a-9a51-1f2b3c4d5e6f', url: '/v.mp4', width: 1920, height: 1080, uploadedAt: '2026-10-23' }
  const captions = { storageKey: 'media/captions/1761200000000-ab12cd34.vtt', url: '/c.vtt', fileName: 'en.vtt', bytes: 300 }

  it('defaults have no video, so the section stays hidden', () => {
    expect(IntroVideoContentSchema.safeParse(defaults).success).toBe(true)
    expect(defaults.video).toBeNull()
  })

  it('takes a library video and uploaded captions', () => {
    expect(IntroVideoContentSchema.safeParse({ ...defaults, video, captions }).success).toBe(true)
    expect(assetIdsIn({ ...defaults, video })).toEqual([video.assetId])
  })

  it('refuses captions outside their upload folder', () => {
    for (const storageKey of ['media/library/x.vtt', 'media/captions/../../etc.vtt', 'media/captions/..', 'media/captions/x.html']) {
      expect(IntroVideoContentSchema.safeParse({ ...defaults, captions: { ...captions, storageKey } }).success).toBe(false)
    }
  })
})

describe('every editable section', () => {
  it.each(SECTION_CONTENT_KEYS)('%s defaults pass their own schema', (key) => {
    const { schema, defaults } = SECTION_CONTENT[key]
    const parsed = schema.safeParse(defaults)
    expect(parsed.success ? [] : parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)).toEqual([])
  })
})

describe('capabilities label', () => {
  it('fills the label into content saved before the label existed', () => {
    const { eyebrow: _dropped, ...saved } = SECTION_CONTENT['product-cms:capabilities'].defaults
    expect(resolveSectionContent('product-cms:capabilities', saved).eyebrow).toBe('Features')
  })
})

describe('About at a glance', () => {
  it('keeps exactly four figures', () => {
    const { schema, defaults } = SECTION_CONTENT['about:facts']
    expect(schema.safeParse({ ...defaults, items: defaults.items.slice(0, 3) }).success).toBe(false)
  })

  it('takes the founding year from the company facts', () => {
    expect(SECTION_CONTENT['about:facts'].defaults.items[0]?.value).toBe('2026')
  })
})
