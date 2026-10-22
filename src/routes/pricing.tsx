import { createFileRoute } from '@tanstack/react-router'
import { PricingSection } from '~/components/blocks/PricingSection'
import { FaqAccordion } from '~/components/blocks/FaqAccordion'
import { CtaBand } from '~/components/blocks/CtaBand'
import { Breadcrumbs } from '~/components/layout/Breadcrumbs'
import { PRICING_FAQ } from '~/data/pricing-faq'
import { TERM_PLANS, formatUsd } from '~/data/pricing'
import { generateMetaTags } from '~/lib/seo/meta'
import { getBreadcrumbSchema, getFaqSchema } from '~/lib/seo/jsonld'

const BREADCRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Pricing', path: '/pricing' },
]

const yearlyPrice = formatUsd(TERM_PLANS[0]?.price ?? 0)
const bestSave = Math.max(0, ...TERM_PLANS.map((p) => p.save ?? 0))

export const Route = createFileRoute('/pricing')({
  head: () => {
    const seo = generateMetaTags({
      title: `Viewixsoft CMS Pricing: ${yearlyPrice} per Screen per Year`,
      description: `Viewixsoft CMS costs ${yearlyPrice} per screen licence per year, with up to ${bestSave}% off on longer plans. Self-host from 20 screens or ask for a quote.`,
      canonicalUrl: '/pricing',
    })
    return {
      meta: seo.meta,
      links: seo.links,
      scripts: [
        { type: 'application/ld+json', children: JSON.stringify(getBreadcrumbSchema(BREADCRUMBS)) },
        { type: 'application/ld+json', children: JSON.stringify(getFaqSchema(PRICING_FAQ)) },
      ],
    }
  },
  component: PricingPage,
})

function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-20 px-4 py-12 sm:px-6 md:py-20 lg:px-8">
      <div className="space-y-8">
        <Breadcrumbs items={BREADCRUMBS} />
        <header className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Pricing</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance text-ink-50 sm:text-5xl">
            Simple per-screen pricing for <span className="text-brand-gradient">Viewixsoft CMS</span>
          </h1>
          <p className="mt-5 text-lg text-pretty text-ink-400">
            You pay {yearlyPrice} per screen licence per year. Longer plans save up to {bestSave}%, and networks of 20 or more screens can host Viewixsoft CMS on their own server.
          </p>
        </header>
      </div>

      <PricingSection showIntro={false} />

      <section aria-labelledby="pricing-faq-title" className="space-y-8 border-t border-ink-800 pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">FAQ</p>
          <h2 id="pricing-faq-title" className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-50">
            Pricing questions
          </h2>
        </div>
        <FaqAccordion items={PRICING_FAQ} />
      </section>

      <CtaBand
        title="Need a quote for a larger network?"
        description="Tell us how many screens you run and where. The Viewixsoft team will reply by email with a quote for your setup."
      />
    </div>
  )
}
