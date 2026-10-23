import { describe, expect, it } from 'vitest'
import { pageContent } from '~/lib/page-content'
import { pricingFaq, pricingFromConfig, pricingIntroText } from '~/lib/pricing'
import { buildLlmsFullTxt, productMarkdown } from '~/lib/seo/generators'
import { PricingPlansSchema, SECTION_CONTENT } from '~/lib/section-content'
import { DEFAULT_SITE_CONFIG, visibleProducts } from '~/lib/site-config'
import type { SiteConfig } from '~/lib/site-config'

const DEFAULTS = SECTION_CONTENT['product-cms:pricing-plans'].defaults
const edited = {
  ...DEFAULTS,
  termPlans: DEFAULTS.termPlans.map((t) => (t.years === 1 ? { ...t, price: 59 } : t)),
  customerServer: { ...DEFAULTS.customerServer, minLicences: 25 },
}
const withContent = (content: SiteConfig['content']): SiteConfig => ({ ...DEFAULT_SITE_CONFIG, content })

describe('Viewixsoft CMS prices', () => {
  it('uses the code prices until the admin edits them', () => {
    expect(pricingFromConfig(DEFAULT_SITE_CONFIG)).toBe(DEFAULTS)
    expect(pricingFromConfig(withContent({ 'product-cms:pricing-plans': edited })).termPlans[0]?.price).toBe(59)
  })

  it('quotes edited prices everywhere: FAQ, intro, /pricing snippet and llms-full.txt', () => {
    const config = withContent({ 'product-cms:pricing-plans': edited })
    expect(pricingFaq(edited)[0]?.answer).toContain('$59')
    expect(pricingIntroText(edited)).toContain('$59')
    expect(pricingIntroText(edited)).toContain('25 or more screens')
    expect(pageContent(config, 'pricing').seo.title).toContain('$59')
    expect(buildLlmsFullTxt(undefined, undefined, undefined, edited)).toContain('costs $59 per screen licence')
  })

  it('refuses more than one best-value plan', () => {
    const twoBest = { ...DEFAULTS, termPlans: DEFAULTS.termPlans.map((t) => ({ ...t, bestValue: true })) }
    expect(PricingPlansSchema.safeParse(twoBest).success).toBe(false)
  })

  it('refuses a Customer Server minimum inside the cloud plan range', () => {
    const overlap = { ...DEFAULTS, customerServer: { ...DEFAULTS.customerServer, minLicences: DEFAULTS.maxOnlineLicences } }
    expect(PricingPlansSchema.safeParse(overlap).success).toBe(false)
  })

  it('refuses an empty or zero price', () => {
    for (const price of [Number.NaN, 0, -5]) {
      const bad = { ...DEFAULTS, termPlans: DEFAULTS.termPlans.map((t, i) => (i === 0 ? { ...t, price } : t)) }
      expect(PricingPlansSchema.safeParse(bad).success).toBe(false)
    }
  })
})

describe('Viewixsoft CMS spec table and FAQ', () => {
  it('reach the Markdown twin and llms-full.txt once edited', () => {
    const table = { groups: [{ id: 'g', category: 'Players', note: '', items: [{ id: 'r', label: 'Chipset', value: 'RK3588 only' }] }] }
    const faq = { ...SECTION_CONTENT['product-cms:faq'].defaults, items: [{ id: 'q', question: 'Does it run offline?', answer: 'Yes, screens play cached content.' }] }
    const cms = visibleProducts(withContent({ 'product-cms:spec-table': table, 'product-cms:faq': faq })).find((p) => p.slug === 'cms')
    expect(cms).toBeDefined()
    const md = cms ? productMarkdown(cms) : ''
    expect(md).toContain('- Chipset: RK3588 only')
    expect(md).toContain('Does it run offline?')
  })
})
