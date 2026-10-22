import type { FaqItem } from '~/components/blocks/FaqAccordion'
import { CUSTOMER_SERVER, MAX_ONLINE_LICENCES, TERM_PLANS, formatUsd } from '~/data/pricing'

const oneYear = TERM_PLANS.find((p) => p.years === 1)
const longer = TERM_PLANS.filter((p) => p.years > 1)
  .map((p) => `${p.years} years costs ${formatUsd(p.price)}${p.save ? ` (save ${p.save}%)` : ''}`)
  .join(', ')
const volume = CUSTOMER_SERVER.volumeDiscounts.map((d) => `${d.percentOff}% off at ${d.licences} licences`).join(' and ')

/** Pricing FAQ, built from `pricing.ts` so answers never drift from the price table. */
export const PRICING_FAQ: FaqItem[] = [
  {
    question: 'How much does Viewixsoft CMS cost?',
    answer: `Viewixsoft CMS costs ${formatUsd(oneYear?.price ?? 0)} per screen licence per year on a 1-year plan. Prices are in USD.`,
  },
  {
    question: 'Is Viewixsoft CMS cheaper on a longer plan?',
    answer: `Yes. One licence for ${longer}, compared with paying the 1-year price every year.`,
  },
  {
    question: 'Can I run Viewixsoft CMS on my own server?',
    answer: `Yes, from ${CUSTOMER_SERVER.minLicences} licences. The Customer Server plan costs ${formatUsd(CUSTOMER_SERVER.endUser.price)} per licence for end users, with ${volume}. Cloud plans cover up to ${MAX_ONLINE_LICENCES} licences.`,
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
