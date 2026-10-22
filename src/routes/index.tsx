import { createFileRoute } from '@tanstack/react-router'
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
import { getFaqSchema, getVideoSchema } from '~/lib/seo/jsonld'

export const Route = createFileRoute('/')({
  head: () => {
    const seo = generateMetaTags({
      title: 'Viewixsoft — Digital Signage Software for Ad Screens',
      description: 'Viewixsoft CMS lets you upload, schedule and publish content to every advertising screen from one cloud dashboard. POS, Tracking and NFC are coming soon.',
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
  return (
    <>
      {/* Order: what it is → what you can buy → how it works → where it runs →
          who uses it → the bigger vision → what it costs → questions → demo. */}
      <HeroOne showHeader={false} underFixedHeader />
      <IntroVideoSection />
      <ProductLineupSection />
      <HowItWorks />
      <CompatibleDevicesSection />
      <UseCasesSection />
      <SolutionsSection id="solutions" />
      <PricingTeaser />
      <HomeFaqSection />
      <LeadFormSection />
    </>
  )
}
