import { Fragment } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { orderSections } from '~/lib/site-config'
import { useSiteConfig } from '~/lib/use-site-config'
import { HeroOne } from '~/components/blocks/hero-01'
import { IntroVideoSection } from '~/components/blocks/IntroVideoSection'
import { SolutionsSection } from '~/components/blocks/SolutionsSection'
import { ProductLineupSection } from '~/components/blocks/ProductLineupSection'
import { CompatibleDevicesSection } from '~/components/blocks/CompatibleDevicesSection'
import { UseCasesSection } from '~/components/blocks/UseCasesSection'
import { HowItWorks } from '~/components/blocks/HowItWorks'
import { PricingTeaser } from '~/components/blocks/PricingTeaser'
import { HomeFaqSection } from '~/components/blocks/HomeFaqSection'
import { LeadFormSection } from '~/components/blocks/LeadFormSection'
import { HOME_FAQ } from '~/data/home-faq'
import { INTRO_VIDEO } from '~/data/intro-video'
import { generateMetaTags } from '~/lib/seo/meta'
import { pageContent, siteConfigFromMatches } from '~/lib/page-content'
import { getFaqSchema, getVideoSchema } from '~/lib/seo/jsonld'

export const Route = createFileRoute('/')({
  head: ({ matches }) => {
    const seo = generateMetaTags({
      ...pageContent(siteConfigFromMatches(matches), 'home').seo,
      canonicalUrl: '/',
    })

    return {
      meta: seo.meta,
      links: seo.links,
      scripts: [
        { type: 'application/ld+json', children: JSON.stringify(getFaqSchema(HOME_FAQ)) },
        // VideoObject needs a real file, thumbnail and date, so it waits for all three.
        ...(INTRO_VIDEO.src && INTRO_VIDEO.poster && INTRO_VIDEO.uploadDate
          ? [{ type: 'application/ld+json', children: JSON.stringify(getVideoSchema(INTRO_VIDEO)) }]
          : []),
      ],
    }
  },
  component: HomePage,
})

function HomePage() {
  const config = useSiteConfig()
  // Order and visibility come from /admin/site; see src/data/site-sections.ts.
  const sections = orderSections(config, 'home', {
    hero: <HeroOne showHeader={false} underFixedHeader />,
    'intro-video': <IntroVideoSection />,
    products: <ProductLineupSection />,
    'how-it-works': <HowItWorks />,
    devices: <CompatibleDevicesSection />,
    'use-cases': <UseCasesSection />,
    vision: <SolutionsSection id="solutions" />,
    pricing: <PricingTeaser />,
    faq: <HomeFaqSection />,
    'demo-form': <LeadFormSection />,
  })
  return (
    <>
      {sections.map((s) => (
        <Fragment key={s.key}>{s.node}</Fragment>
      ))}
    </>
  )
}
