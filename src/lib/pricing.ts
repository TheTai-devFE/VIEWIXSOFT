import type { FaqItem } from '~/components/blocks/FaqAccordion'
import { formatUsd } from '~/data/pricing'
import { resolveSectionContent } from '~/lib/section-content'
import type { PricingPlans } from '~/lib/section-content'
import type { SiteConfig } from '~/lib/site-config'

/*
 * Viewixsoft CMS prices as published: edited in /admin/pages (Viewixsoft CMS →
 * Pricing), else the defaults in src/data/pricing.ts. Every page, FAQ and
 * structured-data block that quotes a price reads it from here, so they never
 * disagree.
 */

export type { PricingPlans }

export function pricingFromConfig(config: SiteConfig): PricingPlans {
  return resolveSectionContent('product-cms:pricing-plans', config.content['product-cms:pricing-plans'])
}

export const yearlyPlan = (p: PricingPlans) => p.termPlans.find((t) => t.years === 1) ?? p.termPlans[0]
export const bestSave = (p: PricingPlans) => Math.max(0, ...p.termPlans.map((t) => t.save))

/** The default pricing intro, quoting the current prices; an intro edited in /admin/pages replaces it. */
export function pricingIntroText(p: PricingPlans) {
  return `Viewixsoft CMS costs ${formatUsd(yearlyPlan(p)?.price ?? 0)} per screen licence per year, and less per year on 2, 3 and 5 year plans. Networks of ${p.customerServer.minLicences} or more screens can run it on their own server, and enterprises can ask for a custom quote.`
}

/** Pricing FAQ, built from the prices so answers never drift from the price table. */
export function pricingFaq(p: PricingPlans): FaqItem[] {
  const longer = p.termPlans
    .filter((t) => t.years > 1)
    .map((t) => `${t.years} years costs ${formatUsd(t.price)}${t.save ? ` (save ${t.save}%)` : ''}`)
    .join(', ')
  const { customerServer: server } = p
  const volume = server.volumeDiscounts.map((d) => `${d.percentOff}% off at ${d.licences} licences`).join(' and ')
  return [
    {
      question: 'How much does Viewixsoft CMS cost?',
      answer: `Viewixsoft CMS costs ${formatUsd(yearlyPlan(p)?.price ?? 0)} per screen licence per year on a 1-year plan. Prices are in USD.`,
    },
    {
      question: 'Is Viewixsoft CMS cheaper on a longer plan?',
      answer: `Yes. One licence for ${longer}, compared with paying the 1-year price every year.`,
    },
    {
      question: 'Can I run Viewixsoft CMS on my own server?',
      answer: `Yes, from ${server.minLicences} licences. The Customer Server plan costs ${formatUsd(server.endUserPrice)} per licence for end users${volume ? `, with ${volume}` : ''}. Cloud plans cover up to ${p.maxOnlineLicences} licences.`,
    },
    {
      question: 'How much do Viewixsoft POS, Tracking and NFC cost?',
      answer:
        'Viewixsoft POS, Viewixsoft Tracking and Viewixsoft NFC are not released yet, so they have no price. Prices will be published when each product launches.',
    },
    {
      question: 'How do I get a quote for a large screen network?',
      answer:
        'Send the contact form with your screen count and locations. The Viewixsoft team will reply by email with a quote for your setup.',
    },
  ]
}
