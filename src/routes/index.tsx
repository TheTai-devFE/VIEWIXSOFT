import { Fragment } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { orderSections } from '~/lib/site-config'
import { useSiteConfig } from '~/lib/use-site-config'
import { HeroOne } from '~/components/blocks/hero-01'
import { ProductLineupSection } from '~/components/blocks/ProductLineupSection'
import { CompatibleDevicesSection } from '~/components/blocks/CompatibleDevicesSection'
import { UseCasesSection } from '~/components/blocks/UseCasesSection'
import { HowItWorks } from '~/components/blocks/HowItWorks'
import { PricingTeaser } from '~/components/blocks/PricingTeaser'
import { HomeFaqSection } from '~/components/blocks/HomeFaqSection'
import { ContactCtaSection } from '~/components/blocks/LeadFormSection'
import { generateMetaTags } from '~/lib/seo/meta'
import { pageContent, siteConfigFromMatches } from '~/lib/page-content'
import { getFaqSchema } from '~/lib/seo/jsonld'
import { resolveSectionContent } from '~/lib/section-content'

export const Route = createFileRoute('/')({
  head: ({ matches }) => {
    const config = siteConfigFromMatches(matches)
    // The JSON-LD lists the same questions the FAQ section shows, edited or not.
    const faq = resolveSectionContent('home:faq', config.content['home:faq']).items
    const seo = generateMetaTags({
      ...pageContent(config, 'home').seo,
      canonicalUrl: '/',
    })

    return {
      meta: seo.meta,
      links: seo.links,
      scripts: [{ type: 'application/ld+json', children: JSON.stringify(getFaqSchema(faq)) }],
    }
  },
  component: HomePage,
})

function HomePage() {
  const config = useSiteConfig()
  // Order and visibility come from /admin/site; see src/data/site-sections.ts.
  const sections = orderSections(config, 'home', {
    hero: <HeroOne underFixedHeader />,
    products: <ProductLineupSection />,
    'how-it-works': <HowItWorks />,
    devices: <CompatibleDevicesSection />,
    'use-cases': <UseCasesSection />,
    pricing: <PricingTeaser />,
    faq: <HomeFaqSection />,
    'demo-form': <ContactCtaSection />,
  })
  return (
    <>
      {sections.map((s) => (
        <Fragment key={s.key}>{s.node}</Fragment>
      ))}
    </>
  )
}
