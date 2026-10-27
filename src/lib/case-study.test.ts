import { describe, expect, it } from 'vitest'
import { UseCaseFormSchema } from '~/lib/admin-schemas'
import { describeIssue } from '~/components/admin/use-cases/form-errors'
import { imageSides, storyProblems } from '~/lib/case-study'
import { productFit } from '~/components/blocks/CaseStudyMatrix'
import { forPublic, mergeUseCases, useCaseFromRow } from '~/lib/use-case-from-row'
import { useCaseMarkdown } from '~/lib/seo/generators'
import { USE_CASES } from '~/content/useCases'
import type { UseCaseRow } from '~/server/db/schema'

const base = {
  title: 'Run every store screen from one place',
  slug: 'retail',
  industry: 'Retail',
  tagline: 'Viewixsoft CMS lets retail teams schedule promotions across store screens.',
  challenge: 'Printed posters take days to reach every store.',
  solution: 'Start with Viewixsoft CMS on window and checkout screens.',
  status: 'draft',
}

const measured = { metric: '+18%', label: 'Promo sales', period: 'Mar–Jun 2026', source: 'Viewixsoft Tracking' }

describe('storyProblems', () => {
  it('never checks an industry guide', () => {
    expect(storyProblems({ mode: 'guide', results: [] })).toEqual([])
  })

  it('needs a result or a customer quote on a customer story', () => {
    expect(storyProblems({ mode: 'story', results: [] })).toHaveLength(1)
    const story = { topic: 'Promotions', quote: 'We switch every store at once.', role: 'Ops manager', team: 'Fashion retail' }
    expect(storyProblems({ mode: 'story', results: [], stories: [story] })).toEqual([])
  })

  it('needs a period and a source on every result', () => {
    const problems = storyProblems({ mode: 'story', results: [{ metric: '+18%', label: 'Promo sales' }] })
    expect(problems).toEqual(['Kết quả 1: cần ghi kỳ đo (ví dụ: Tháng 3–6/2026).', 'Kết quả 1: cần ghi nguồn (đo bằng cách nào).'])
  })
})

describe('UseCaseFormSchema with page blocks', () => {
  it('defaults to an industry guide with empty blocks', () => {
    const parsed = UseCaseFormSchema.parse(base)
    expect(parsed.mode).toBe('guide')
    expect(parsed.setup).toEqual([])
    expect(parsed.faq).toEqual([])
  })

  it('rejects a customer story with unsourced figures', () => {
    const res = UseCaseFormSchema.safeParse({ ...base, mode: 'story', results: [{ metric: '+18%', label: 'Promo sales' }] })
    expect(res.success).toBe(false)
  })

  it('accepts a customer story with measured figures', () => {
    expect(UseCaseFormSchema.safeParse({ ...base, mode: 'story', results: [measured] }).success).toBe(true)
  })

  it('accepts a product without a description', () => {
    const res = UseCaseFormSchema.safeParse({
      ...base,
      setup: [{ productSlug: 'cms', name: 'Viewixsoft CMS', role: '', need: 'core' }],
    })
    expect(res.success).toBe(true)
  })
})

const row = (overrides: Partial<UseCaseRow> = {}): UseCaseRow => ({
  id: '00000000-0000-4000-8000-000000000000',
  slug: 'retail',
  title: 'Retail from the database',
  seoTitle: null,
  industry: 'Retail',
  tagline: 'Tagline',
  coverUrl: null,
  coverAlt: null,
  challengeHeading: 'Why?',
  challenge: 'Because.',
  solutionHeading: 'How?',
  solution: 'Like this.',
  results: [measured],
  quote: null,
  featuredProducts: [{ slug: 'cms', name: 'Viewixsoft CMS' }],
  mode: 'guide',
  highlights: [],
  sections: [],
  setup: [],
  stories: [],
  faq: [],
  reviewedBy: null,
  createdBy: null,
  updatedBy: null,
  status: 'published',
  publishedAt: new Date('2026-10-01T00:00:00Z'),
  createdAt: new Date('2026-09-01T00:00:00Z'),
  updatedAt: new Date('2026-10-20T00:00:00Z'),
  ...overrides,
})

describe('useCaseFromRow', () => {
  it('maps a row to the page shape', () => {
    const uc = useCaseFromRow(row())
    expect(uc.seoTitle).toBe('Retail from the database')
    expect(uc.publishedAt).toBe('2026-10-01')
    expect(uc.updatedAt).toBe('2026-10-20')
    expect(uc.cover.src).toMatch(/^\//)
  })

  it('reads a row written before content blocks as two blocks', () => {
    const uc = useCaseFromRow(row())
    expect(uc.sections.map((x) => x.heading)).toEqual(['Why?', 'How?'])
  })

  it('prefers content blocks over the old challenge and solution', () => {
    const uc = useCaseFromRow(row({ sections: [{ heading: 'One block', body: 'Text.' }] }))
    expect(uc.sections).toHaveLength(1)
  })

  it('lets database rows replace bundled samples with the same slug', () => {
    const merged = mergeUseCases([row()], USE_CASES)
    expect(merged.filter((u) => u.slug === 'retail')).toHaveLength(1)
    expect(merged[0]?.title).toBe('Retail from the database')
    expect(merged).toHaveLength(USE_CASES.length)
  })
})

describe('productFit', () => {
  it('uses the recommended setup when there is one', () => {
    const uc = { featuredProducts: [], setup: [{ productSlug: 'nfc', name: 'Viewixsoft NFC', role: 'Tap to shop', need: 'add-on' as const }] }
    expect(productFit(uc, 'nfc')).toBe('add-on')
    expect(productFit(uc, 'cms')).toBeNull()
  })

  it('falls back to featured products without a setup', () => {
    const uc = { featuredProducts: [{ slug: 'cms', name: 'Viewixsoft CMS' }], setup: [] }
    expect(productFit(uc, 'cms')).toBe('recommended')
  })
})

describe('useCaseMarkdown', () => {
  it('leaves figures out of an industry guide', () => {
    const md = useCaseMarkdown(useCaseFromRow(row()))
    expect(md).toContain('Type: industry guide')
    expect(md).not.toContain('+18%')
  })

  it('publishes figures with period and source on a customer story', () => {
    const md = useCaseMarkdown(
      useCaseFromRow(
        row({
          mode: 'story',
          setup: [{ productSlug: 'cms', name: 'Viewixsoft CMS', role: 'Schedules promotions', need: 'core' }],
          sections: [{ heading: 'How does it work?', body: 'Like this.' }],
          faq: [{ question: 'Can I use my screens?', answer: 'Yes.' }],
        }),
      ),
    )
    expect(md).toContain('+18% Promo sales. Mar–Jun 2026, Viewixsoft Tracking')
    expect(md).toContain('- [Viewixsoft CMS](')
    expect(md).toContain('## How does it work?')
    expect(md).toContain('### Can I use my screens?')
  })
})

describe('forPublic', () => {
  it('drops figures and quotes from an industry guide', () => {
    const story = { topic: 'T', quote: 'Q', role: 'R', team: 'Team' }
    const uc = forPublic(useCaseFromRow(row({ quote: { text: 'Great', author: 'A', title: 'B', company: 'C' }, stories: [story] })))
    expect(uc.stories).toEqual([])
    expect(uc.results).toEqual([])
    expect(uc.quote.text).toBe('')
  })

  it('keeps them on a customer story', () => {
    expect(forPublic(useCaseFromRow(row({ mode: 'story' }))).results).toHaveLength(1)
  })
})

describe('imageSides', () => {
  const img = { url: '/a.webp', alt: '' }

  it('alternates text-image, image-text over blocks with an image', () => {
    expect(imageSides([{ image: img }, { image: img }, { image: img }])).toEqual(['right', 'left', 'right'])
  })

  it('skips blocks without an image so two picture rows never face the same way', () => {
    expect(imageSides([{ image: img }, {}, { image: img }])).toEqual(['right', undefined, 'left'])
  })
})

describe('describeIssue', () => {
  const messages = (input: object) => {
    const res = UseCaseFormSchema.safeParse({ ...base, ...input })
    return res.success ? [] : res.error.issues.map(describeIssue)
  }

  it('names the block and field that is empty', () => {
    expect(messages({ sections: [{ heading: 'One', body: 'Text' }, { heading: '', body: 'Text' }] })).toEqual([
      'Mục nội dung 2: tiêu đề đang trống.',
    ])
  })

  it('names top-level fields as the editor labels them', () => {
    expect(messages({ tagline: 'x'.repeat(251) })).toEqual(['Tóm tắt quá dài (tối đa 250 ký tự).'])
  })

  it('keeps the customer story rules as written', () => {
    expect(messages({ mode: 'story' })).toEqual(['Bài Customer story cần ít nhất một kết quả đo được hoặc một trích dẫn của khách hàng.'])
  })
})
