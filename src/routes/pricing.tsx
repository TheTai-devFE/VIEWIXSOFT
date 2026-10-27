import { createFileRoute, notFound } from '@tanstack/react-router'
import { PricingSection } from '~/components/blocks/PricingSection'
import { FaqAccordion } from '~/components/blocks/FaqAccordion'
import { CtaBand } from '~/components/blocks/CtaBand'
import { Breadcrumbs } from '~/components/layout/Breadcrumbs'
import { pricingFaq, pricingFromConfig } from '~/lib/pricing'
import { usePricing } from '~/lib/use-pricing'
import { pageContent, siteConfigFromMatches } from '~/lib/page-content'
import { usePageContent } from '~/lib/use-page-content'
import { HeroTitle } from '~/components/ui/hero-heading'
import { generateMetaTags } from '~/lib/seo/meta'
import { getBreadcrumbSchema, getFaqSchema } from '~/lib/seo/jsonld'
import { getSiteConfigFn } from '~/server/functions/site'
import { isPageVisible } from '~/lib/page-visibility'

const BREADCRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Pricing', path: '/pricing' },
]


export const Route = createFileRoute('/pricing')({
  loader: async () => {
    const config = await getSiteConfigFn()
    if (!isPageVisible(config, 'pricing')) throw notFound()
  },
  head: ({ matches }) => {
    const config = siteConfigFromMatches(matches)
    const seo = generateMetaTags({
      ...pageContent(config, 'pricing').seo,
      canonicalUrl: '/pricing',
    })
    return {
      meta: seo.meta,
      links: seo.links,
      scripts: [
        { type: 'application/ld+json', children: JSON.stringify(getBreadcrumbSchema(BREADCRUMBS)) },
        { type: 'application/ld+json', children: JSON.stringify(getFaqSchema(pricingFaq(pricingFromConfig(config)))) },
      ],
    }
  },
  component: PricingPage,
})

function PricingPage() {
  const { hero } = usePageContent('pricing')
  const faq = pricingFaq(usePricing())
  return (
    <div className="page-x space-y-20 py-12 md:py-20">
      <div className="space-y-8">
        <Breadcrumbs items={BREADCRUMBS} />
        <header className="mx-auto max-w-3xl text-center">
          {hero.eyebrow && <p className="eyebrow">{hero.eyebrow}</p>}
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance text-ink-50 sm:text-5xl">
            <HeroTitle hero={hero} />
          </h1>
          {hero.description && <p className="mt-5 text-lg text-pretty text-ink-400">{hero.description}</p>}
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
        <FaqAccordion items={faq} />
      </section>

      <CtaBand
        title="Need a quote for a larger network?"
        description="Tell us how many screens you run and where. The Viewixsoft team will reply by email with a quote for your setup."
      />
    </div>
  )
}
