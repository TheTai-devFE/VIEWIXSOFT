import { z } from 'zod'
import { VIEWIX_HARDWARE } from '~/data/compatible-devices'
import { HOME_FAQ } from '~/data/home-faq'
import { PARTNERS } from '~/data/partners'
import { PRODUCTS } from '~/content/products'
import { pageDefaults } from '~/data/page-content'
import { FOUNDED_YEAR, ORIGIN_STORY, VIEWIX_CATALOGUE } from '~/data/company'
import { CUSTOMER_SERVER, MAX_ONLINE_LICENCES, SALES_CONTACT, TERM_FEATURES, TERM_PLANS, formatUsd } from '~/data/pricing'

/**
 * Section content an admin can edit in /admin/pages: each editable section
 * has a Zod schema and defaults taken from the code. Stored content (table
 * `section_content`) replaces the defaults as a whole; invalid or missing
 * content falls back to them, so the site renders the same without a database.
 * Add a section here, then read it with `useSectionContent`.
 */

/** What a jsonb column holds; also what crosses the server-function boundary. */
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

const noHtml = (v: string) => !/[<>]/.test(v)
// Any spelling other than the exact brand ("viewixsoft", "ViewixSoft"…) is rejected.
const brandOk = (v: string) => !/viewixsoft/i.test(v.replace(/Viewixsoft/g, ''))

function text(min: number, max: number) {
  return z
    .string()
    .trim()
    .min(min, min > 1 ? `Use at least ${min} characters` : 'Fill this in')
    .max(max, `Keep it under ${max} characters`)
    .refine(noHtml, 'Remove < and >; HTML is not allowed')
    .refine(brandOk, 'Write the brand as "Viewixsoft"')
}

/** Text that may be left empty, which hides it on the page. */
function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, `Keep it under ${max} characters`)
    .refine(noHtml, 'Remove < and >; HTML is not allowed')
    .refine(brandOk, 'Write the brand as "Viewixsoft"')
}

/** A library image as used in a section. The server refills url and size from the library on save. */
export const SectionImageSchema = z.object({
  assetId: z.string().uuid(),
  url: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: text(3, 200),
})

export type SectionImage = z.output<typeof SectionImageSchema>

/** A logo: its alt text is the name shown next to it, so it has none of its own. */
export const LogoImageSchema = SectionImageSchema.omit({ alt: true })

export const DevicesContentSchema = z.object({
  eyebrow: optionalText(40),
  title: text(3, 120),
  description: optionalText(300),
  items: z
    .array(
      z.object({
        /** Stable id so reordering keeps each card's state; not shown. */
        id: z.string().min(1).max(60),
        name: text(2, 80),
        /** Small line under the name, e.g. the model range; hidden while empty. */
        brand: optionalText(60),
        image: SectionImageSchema.nullable(),
      }),
    )
    .min(1, 'Keep at least one device')
    .max(15, 'Show at most 15 devices'),
})

export type DevicesContent = z.output<typeof DevicesContentSchema>

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const DEVICES_DEFAULTS: DevicesContent = {
  eyebrow: 'Compatible hardware',
  title: 'Software Built for Your Digital Displays.',
  description:
    'Viewixsoft provides software solutions for digital signage devices, including interactive kiosks, POS terminals, and commercial display screens, helping businesses manage and deliver content across their screen networks.',
  items: VIEWIX_HARDWARE.map((h) => ({ id: slug(h.name), name: h.name, brand: h.brand, image: null })),
}

export const HomeHeroContentSchema = z.object({
  /** Line above the logos; empty hides it. */
  partnersLabel: optionalText(80),
  /** Empty hides the logo strip. Only partners who gave written permission to show their logo. */
  partners: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        name: text(2, 80),
        /** Without a logo the name shows as text. */
        logo: LogoImageSchema.nullable(),
      }),
    )
    .max(20, 'Show at most 20 partners'),
})

export type HomeHeroContent = z.output<typeof HomeHeroContentSchema>

const HOME_HERO_DEFAULTS: HomeHeroContent = {
  partnersLabel: '',
  partners: PARTNERS.map((p) => ({ id: slug(p.name), name: p.name, logo: null })),
}

export const FaqContentSchema = z.object({
  eyebrow: optionalText(40),
  title: text(3, 120),
  /** Also published as FAQPage JSON-LD and in llms-full.txt, so answers stand on their own. */
  items: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        question: text(5, 160),
        answer: text(10, 800),
      }),
    )
    .min(1, 'Keep at least one question')
    .max(12, 'Show at most 12 questions'),
})

export type FaqContent = z.output<typeof FaqContentSchema>

const HOME_FAQ_DEFAULTS: FaqContent = {
  eyebrow: 'FAQ',
  title: 'Questions about Viewixsoft',
  items: HOME_FAQ.map((f) => ({ id: slug(f.question), question: f.question, answer: f.answer })),
}

export const HowItWorksContentSchema = z.object({
  eyebrow: optionalText(40),
  title: text(3, 120),
  description: optionalText(400),
  steps: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        title: text(3, 80),
        description: text(10, 300),
      }),
    )
    .min(2, 'Keep at least 2 steps')
    .max(4, 'Show at most 4 steps'),
})

export type HowItWorksContent = z.output<typeof HowItWorksContentSchema>

// Steps use only confirmed Viewixsoft CMS facts (player OS, offline cache, remote management).
const HOW_IT_WORKS_DEFAULTS: HowItWorksContent = {
  eyebrow: 'How it works',
  title: 'One Platform. Every Digital Screen.',
  description:
    'Viewixsoft delivers digital signage software solutions that help businesses centrally manage devices, distribute content, and operate digital display networks with ease and flexibility, from anywhere.',
  steps: [
    {
      id: 'connect',
      title: 'Connect your Viewix screens',
      description:
        'Viewixsoft CMS runs on Viewix players with Android 11 or later. Connect each screen over Wi-Fi or Ethernet and it appears in your dashboard.',
    },
    {
      id: 'upload',
      title: 'Upload media and build playlists',
      description:
        'Add videos, images and web pages, arrange them in multi-zone layouts, and schedule them by time of day and by location.',
    },
    {
      id: 'publish',
      title: 'Publish and manage from anywhere',
      description:
        'Send changes to one screen or a whole group from the cloud. Screens cache their content, so playback continues if the internet drops.',
    },
  ],
}

export const ContactSectionContentSchema = z.object({
  eyebrow: optionalText(40),
  title: text(3, 80),
  /** End of the heading, painted with the brand gradient; empty paints nothing. */
  highlight: optionalText(40),
  description: optionalText(300),
  /** "What happens next", listed on /contact. */
  steps: z
    .array(z.object({ id: z.string().min(1).max(60), text: text(5, 140) }))
    .min(1, 'Keep at least one step')
    .max(5, 'Show at most 5 steps'),
  partner: z.object({
    show: z.boolean(),
    eyebrow: optionalText(40),
    title: text(3, 100),
    description: optionalText(300),
    cta: text(2, 30),
  }),
})

export type ContactSectionContent = z.output<typeof ContactSectionContentSchema>

const CONTACT_SECTION_DEFAULTS: ContactSectionContent = {
  eyebrow: 'Contact',
  title: 'See Viewixsoft in action on',
  highlight: 'your screens',
  description:
    'Learn how to manage your digital signage from one simple dashboard, set up around your screens and business needs.',
  steps: [
    { id: 'learn', text: 'We learn about your screens, locations and business needs.' },
    { id: 'schedule', text: 'We email you to schedule a demo at a time that suits you.' },
    { id: 'explore', text: 'You explore Viewixsoft CMS in a setup that matches yours.' },
  ],
  partner: {
    show: true,
    eyebrow: 'Partner with us',
    title: 'Grow your business with Viewixsoft',
    description:
      'Join the Viewixsoft partner network to bring digital signage to more businesses and open new revenue streams.',
    cta: 'Contact sales',
  },
}

export const MAX_CAPTIONS_BYTES = 512 * 1024

/** A library video as used in a section. The server refills url, size and upload date from the library on save. */
export const SectionVideoSchema = LogoImageSchema.extend({
  uploadedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

/** Captions uploaded for one video in /admin/pages. The server rebuilds `url` from `storageKey` on save. */
export const CaptionsFileSchema = z.object({
  // Exactly the keys the upload route makes, so a key can never point outside its folder.
  storageKey: z.string().regex(/^media\/captions\/[a-z0-9-]+\.vtt$/),
  url: z.string().min(1).max(500),
  fileName: z.string().max(200),
  bytes: z.number().int().positive(),
})

export const IntroVideoContentSchema = z.object({
  /** Names the play button and the VideoObject; not shown on the page. */
  title: text(3, 100),
  /** VideoObject description for search engines; not shown on the page. */
  description: text(10, 300),
  video: SectionVideoSchema.nullable(),
  poster: LogoImageSchema.nullable(),
  captions: CaptionsFileSchema.nullable(),
})

export type IntroVideoContent = z.output<typeof IntroVideoContentSchema>
export type SectionVideo = z.output<typeof SectionVideoSchema>
export type CaptionsFile = z.output<typeof CaptionsFileSchema>

const INTRO_VIDEO_DEFAULTS: IntroVideoContent = {
  title: 'Viewixsoft CMS product tour',
  description:
    'A short tour of Viewixsoft CMS: connecting screens, uploading media, scheduling content and checking every screen from one dashboard.',
  video: null,
  poster: null,
  captions: null,
}

/*
 * Viewixsoft CMS page (/products/cms). Text only: illustrations, prices and the
 * specification table stay in the code. Defaults are the text the page shows today.
 */

/** A section's label, heading and intro; the shape most sections share. */
const SectionIntroSchema = z.object({
  eyebrow: optionalText(40),
  title: text(3, 120),
  description: optionalText(400),
})

export const CmsWhyContentSchema = z.object({
  /** One line above the heading. */
  eyebrow: optionalText(80),
  /** The page's H1, before the gradient part. */
  title: text(3, 80),
  highlight: optionalText(60),
  description: optionalText(400),
  tags: z
    .array(z.object({ id: z.string().min(1).max(60), text: text(2, 40) }))
    .max(6, 'Show at most 6 tags'),
})

const CMS_CAPABILITY_COUNT = 5

export const CmsCapabilitiesContentSchema = z.object({
  // Added later; content saved before it existed gets the label too.
  eyebrow: optionalText(40).default('Features'),
  title: text(3, 120),
  /** End of the heading, shown muted. */
  highlight: optionalText(60),
  description: optionalText(400),
  // One per illustration, in order, so the count is fixed.
  items: z
    .array(z.object({ id: z.string().min(1).max(60), title: text(3, 60), body: text(10, 400) }))
    .length(CMS_CAPABILITY_COUNT),
})

export const CmsScreensContentSchema = SectionIntroSchema.extend({
  /** Photos for the curved band; empty uses the built-in screen photos. */
  images: z.array(z.object({ id: z.string().min(1).max(60), image: SectionImageSchema })).max(24, 'Use at most 24 photos'),
})

export const CmsUseCasesContentSchema = z.object({ title: text(3, 120) })

export type CmsWhyContent = z.output<typeof CmsWhyContentSchema>
export type CmsCapabilitiesContent = z.output<typeof CmsCapabilitiesContentSchema>
export type CmsScreensContent = z.output<typeof CmsScreensContentSchema>
export type SectionIntroContent = z.output<typeof SectionIntroSchema>
export type CmsUseCasesContent = z.output<typeof CmsUseCasesContentSchema>

const CMS_HERO = pageDefaults('product-cms')?.hero
const CMS_PRODUCT = PRODUCTS.find((p) => p.slug === 'cms')

const CMS_WHY_DEFAULTS: CmsWhyContent = {
  eyebrow: 'Cloud digital signage software for advertising screens',
  title: CMS_HERO?.title ?? 'Why choose',
  highlight: CMS_HERO?.highlight ?? '',
  description: CMS_HERO?.description ?? '',
  tags: ['One cloud dashboard', 'Schedule by time and location', 'Manage screens remotely'].map((t) => ({ id: slug(t), text: t })),
}

const CMS_CAPABILITIES_DEFAULTS: CmsCapabilitiesContent = {
  eyebrow: 'Features',
  title: 'Run every screen from the cloud,',
  highlight: 'wherever it is',
  description:
    'Viewixsoft CMS keeps your media in the cloud, publishes it to screens anywhere in the world, plays it on schedule and reports on every device, all from one dashboard.',
  items: [
    {
      title: 'Cloud media library',
      body: 'Keep images, videos and playlists in one cloud library. Every screen plays from the same source, so there are no USB sticks or local copies to track.',
    },
    {
      title: 'Publish from anywhere',
      body: 'Upload content from any browser and send it to screens in any city or country. Changes reach every selected screen without a site visit.',
    },
    {
      title: 'Schedule by time and location',
      body: 'Set what plays, when and where. When a slot starts, Viewixsoft CMS publishes it to each screen and the screen plays it on its own, so morning menus and evening offers switch without anyone touching a device.',
    },
    {
      title: 'Video wall from separate screens',
      body: 'Place ordinary screens side by side and play one video across all of them, frame for frame, without buying a video wall or a video wall controller.',
    },
    {
      title: 'Device health reports',
      body: 'See every screen in one overview: which are online or offline, when each was last seen and how much content played on schedule.',
    },
  ].map((c) => ({ id: slug(c.title), ...c })),
}

const CMS_SCREENS_DEFAULTS: CmsScreensContent = {
  eyebrow: 'Where it runs',
  title: 'What screens can run Viewixsoft CMS?',
  description:
    'Viewixsoft CMS runs on menu boards, retail displays, interactive kiosks, tablets and transit screens, so one dashboard can control every screen type in your network.',
  images: [],
}

const CMS_SPECS_DEFAULTS: SectionIntroContent = {
  eyebrow: 'Specifications',
  title: 'What does Viewixsoft CMS support?',
  description:
    'Supported file formats, player devices and operating systems, screen resolutions and, where offered, the server needed to host Viewixsoft CMS yourself.',
}

const CMS_PRICING_DEFAULTS: SectionIntroContent = {
  eyebrow: 'Pricing',
  title: 'How much does Viewixsoft CMS cost?',
  // Shown only once edited; until then the page builds this sentence from the current prices.
  description: `Viewixsoft CMS costs ${formatUsd(TERM_PLANS[0]?.price ?? 0)} per screen licence per year, and less per year on 2, 3 and 5 year plans. Networks of ${CUSTOMER_SERVER.minLicences} or more screens can run it on their own server, and enterprises can ask for a custom quote.`,
}

/*
 * Prices and the specification table. Stored apart from the section text
 * (`product-cms:pricing-plans`, `product-cms:spec-table`) because other pages
 * read them too: /pricing, the home price summary, structured data,
 * llms-full.txt and the Markdown twin of /products/cms.
 */

const money = (label: string) =>
  z.number({ message: `Enter ${label}` }).positive(`${label} must be above 0`).max(100_000, `${label} looks too high`)
const count = (label: string) => z.number({ message: `Enter ${label}` }).int(`${label} must be a whole number`).min(1).max(100_000)
const percent = z.number({ message: 'Enter a percentage' }).int('Use a whole number').min(0).max(90, 'At most 90%')

export const PricingPlansSchema = z
  .object({
    // One card per term; the terms themselves are fixed.
    termPlans: z
      .array(
        z.object({
          years: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(5)]),
          /** Price per licence for the whole term. */
          price: money('the price'),
          /** Percent saved against paying the 1-year price every year; 0 hides the badge. */
          save: percent,
          bestValue: z.boolean(),
        }),
      )
      .length(4),
    termFeatures: z
      .array(z.object({ id: z.string().min(1).max(60), text: text(3, 60) }))
      .min(1, 'Keep at least one feature')
      .max(8, 'Show at most 8 features'),
    /** Cloud plans stop at this many licences; above it, Customer Server applies. */
    maxOnlineLicences: count('the cloud licence limit'),
    customerServer: z.object({
      minLicences: count('the minimum licences'),
      endUserPrice: money('the end user price'),
      resellerPriceFrom: money('the reseller price'),
      resellerPriceTo: money('the reseller price'),
      resellerDiscount: text(2, 60),
      volumeDiscounts: z
        .array(
          z.object({
            id: z.string().min(1).max(60),
            licences: count('the licence count'),
            percentOff: percent,
            endUserPrice: money('the price'),
          }),
        )
        .max(6, 'Show at most 6 volume discounts'),
    }),
    sales: z.object({
      email: z.union([z.literal(''), z.string().trim().email('Enter a valid email')]),
      phone: optionalText(40),
      hours: optionalText(80),
    }),
  })
  .refine((p) => p.termPlans.filter((t) => t.bestValue).length <= 1, {
    message: 'Mark at most one plan as best value',
    path: ['termPlans'],
  })
  .refine((p) => p.customerServer.minLicences > p.maxOnlineLicences, {
    message: 'Customer Server must start above the cloud licence limit',
    path: ['customerServer', 'minLicences'],
  })

export type PricingPlans = z.output<typeof PricingPlansSchema>

const PRICING_PLANS_DEFAULTS: PricingPlans = {
  termPlans: TERM_PLANS.map((t) => ({ years: t.years, price: t.price, save: t.save ?? 0, bestValue: t.bestValue ?? false })),
  termFeatures: TERM_FEATURES.map((f) => ({ id: slug(f), text: f })),
  maxOnlineLicences: MAX_ONLINE_LICENCES,
  customerServer: {
    minLicences: CUSTOMER_SERVER.minLicences,
    endUserPrice: CUSTOMER_SERVER.endUser.price,
    resellerPriceFrom: CUSTOMER_SERVER.reseller.priceFrom,
    resellerPriceTo: CUSTOMER_SERVER.reseller.priceTo,
    resellerDiscount: CUSTOMER_SERVER.reseller.discount,
    volumeDiscounts: CUSTOMER_SERVER.volumeDiscounts.map((d) => ({ id: `volume-${d.licences}`, ...d })),
  },
  sales: { email: SALES_CONTACT.email, phone: SALES_CONTACT.phone, hours: SALES_CONTACT.hours },
}

export const SpecTableSchema = z.object({
  groups: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        category: text(3, 80),
        note: optionalText(200),
        items: z
          .array(z.object({ id: z.string().min(1).max(60), label: text(2, 60), value: text(1, 200) }))
          .min(1, 'Keep at least one row')
          .max(12, 'Use at most 12 rows'),
      }),
    )
    .min(1, 'Keep at least one group')
    .max(8, 'Use at most 8 groups'),
})

export type SpecTable = z.output<typeof SpecTableSchema>

const SPEC_TABLE_DEFAULTS: SpecTable = {
  groups: (CMS_PRODUCT?.specs ?? []).map((g) => ({
    id: slug(g.category),
    category: g.category,
    note: g.note ?? '',
    items: g.items.map((i) => ({ id: slug(i.label), label: i.label, value: i.value })),
  })),
}

const CMS_USE_CASES_DEFAULTS: CmsUseCasesContent = { title: 'Recommended use cases for Viewixsoft CMS' }

const CMS_FAQ_DEFAULTS: FaqContent = {
  eyebrow: 'Product FAQ',
  title: 'Frequently asked questions',
  items: (CMS_PRODUCT?.faq ?? []).map((f) => ({ id: slug(f.question), question: f.question, answer: f.answer })),
}

/*
 * About page (/about). Company figures and certifications stay in
 * src/data/company.ts with their source; only the wording is edited here.
 */

export const AboutHeroContentSchema = z.object({
  eyebrow: optionalText(80),
  /** The page's H1, first line. */
  title: text(3, 80),
  /** Second line of the H1, shown muted. */
  highlight: optionalText(80),
  description: optionalText(400),
})

export const AboutStoryContentSchema = z.object({
  eyebrow: optionalText(40),
  title: text(3, 140),
  paragraphs: z
    .array(z.object({ id: z.string().min(1).max(60), text: text(20, 800) }))
    .min(1, 'Keep at least one paragraph')
    .max(5, 'Use at most 5 paragraphs'),
  /** Button to /contact under the first paragraph. Added later, hence the default. */
  cta: text(2, 30).default('Talk to our team'),
})

const VISION_CARDS = [
  {
    id: 'live-status',
    title: 'Live screen status',
    body: 'See which screens are online, where they are and what they play, across every location.',
  },
  {
    id: 'audience-insights',
    title: 'Audience insights',
    body: 'Turn plays and taps into anonymous audience insight for every campaign you run.',
  },
  {
    id: 'campaign-reports',
    title: 'Campaign reports',
    body: 'Plan better ad campaigns with clear reports on what played, where and when.',
  },
]

export const AboutVisionContentSchema = z.object({
  eyebrow: optionalText(40),
  title: text(3, 80),
  /** End of the heading, in the glowing brand gradient. */
  highlight: optionalText(80),
  description: optionalText(500),
  // One per illustration (signals, insights, reports), so the count is fixed. Added later, hence the default.
  cards: z
    .array(z.object({ id: z.string().min(1).max(60), title: text(3, 60), body: text(10, 200) }))
    .length(3)
    .default(VISION_CARDS),
})

export type AboutHeroContent = z.output<typeof AboutHeroContentSchema>
export type AboutStoryContent = z.output<typeof AboutStoryContentSchema>
export type AboutVisionContent = z.output<typeof AboutVisionContentSchema>

const ABOUT_HERO = pageDefaults('about')?.hero

const ABOUT_HERO_DEFAULTS: AboutHeroContent = {
  eyebrow: 'About Viewixsoft',
  title: ABOUT_HERO?.title ?? 'Software built on',
  highlight: ABOUT_HERO?.highlight ?? '',
  description: ABOUT_HERO?.description ?? '',
}

const ABOUT_STORY_DEFAULTS: AboutStoryContent = {
  eyebrow: 'Our story',
  // Quoted from the approved story below.
  title: 'We grew up surrounded by screens',
  paragraphs: ORIGIN_STORY.map((text, i) => ({ id: `paragraph-${i + 1}`, text })),
  cta: 'Talk to our team',
}

const ABOUT_VISION_DEFAULTS: AboutVisionContent = {
  eyebrow: 'Our vision',
  cards: VISION_CARDS,
  title: 'Easy to use.',
  highlight: 'Managed from anywhere.',
  // TODO(content): vision statement drafted from the product brief; confirm wording with the founders.
  description:
    'Viewixsoft builds digital signage software that helps businesses get the full value from their advertising screens. Beyond playing content, every screen becomes a source of anonymous audience insights, such as taps, plays and campaign performance, that you can use to plan better ad campaigns.',
}

const AboutResultsContentSchema = SectionIntroSchema.extend({
  cta: text(2, 40),
})

export type AboutResultsContent = z.output<typeof AboutResultsContentSchema>

// The cards come from the use cases; only `verified` results show in production.
const ABOUT_RESULTS_DEFAULTS: AboutResultsContent = {
  eyebrow: 'Results',
  title: 'How businesses get measurable results with Viewixsoft',
  description:
    'Our customers work in very different industries, but they share one goal: results they can measure. These projects show what their screens achieved.',
  cta: 'View all use cases',
}

const ABOUT_CUSTOMERS_DEFAULTS: SectionIntroContent = {
  eyebrow: 'Customers',
  title: 'Our first customers',
  description: 'The first businesses running Viewix screens with Viewixsoft software.',
}

const ABOUT_FACT_COUNT = 4

export const AboutFactsContentSchema = SectionIntroSchema.extend({
  // A row of four figures, so the count is fixed.
  items: z
    .array(z.object({ id: z.string().min(1).max(60), value: text(1, 24), label: text(3, 120) }))
    .length(ABOUT_FACT_COUNT),
})

export type AboutFactsContent = z.output<typeof AboutFactsContentSchema>

const CATALOGUE_TOTAL = VIEWIX_CATALOGUE.indoorSignage + VIEWIX_CATALOGUE.outdoorSignage + VIEWIX_CATALOGUE.interactiveDisplays

// Figures come from src/data/company.ts, each with its source.
const ABOUT_FACTS_DEFAULTS: AboutFactsContent = {
  eyebrow: 'At a glance',
  title: 'Viewixsoft in four facts',
  description: '',
  items: [
    { id: 'founded', value: String(FOUNDED_YEAR), label: 'Year Viewixsoft was founded' },
    { id: 'parent', value: 'Viewix', label: 'Our parent company, a Hong Kong commercial display maker' },
    {
      id: 'catalogue',
      value: String(CATALOGUE_TOTAL),
      label: `Viewix display models: ${VIEWIX_CATALOGUE.indoorSignage} indoor, ${VIEWIX_CATALOGUE.outdoorSignage} outdoor and ${VIEWIX_CATALOGUE.interactiveDisplays} interactive`,
    },
    { id: 'products', value: String(PRODUCTS.length), label: `Software products: ${PRODUCTS.map((p) => p.name).join(', ').replace(/, ([^,]*)$/, ' and $1')}` },
  ],
}

const ABOUT_FAQ_DEFAULTS: FaqContent = {
  eyebrow: 'FAQ',
  title: 'Questions about Viewixsoft',
  items: [
    {
      question: 'What is Viewixsoft?',
      answer:
        'Viewixsoft is the software company of Viewix, a Hong Kong maker of commercial displays. It builds digital signage software for advertising screens, kiosks and menu boards, starting with Viewixsoft CMS.',
    },
    {
      question: 'When was Viewixsoft founded?',
      answer: `Viewixsoft was founded in ${FOUNDED_YEAR} to build the software that runs on Viewix screens.`,
    },
    {
      question: 'How is Viewixsoft related to Viewix?',
      answer:
        'Viewixsoft is the software arm of Viewix (Shenzhen Viewix Electronic Technology Co., Limited), which is registered in Hong Kong. Viewix makes the screens; Viewixsoft makes the software that runs on them.',
    },
    {
      question: 'Does Viewixsoft sell screens?',
      answer:
        'No. Screens, kiosks and other display hardware come from Viewix. Contact our sales team and we can advise on both the screens and the Viewixsoft software for your project.',
    },
    {
      question: 'Which Viewixsoft products are available today?',
      answer:
        'Viewixsoft CMS is available now. Viewixsoft POS, Viewixsoft Tracking and Viewixsoft NFC are in development and are marked as coming soon on their product pages.',
    },
  ].map((f) => ({ id: slug(f.question), ...f })),
}

interface SectionContentMap {
  'home:devices': DevicesContent
  'home:hero': HomeHeroContent
  'home:faq': FaqContent
  'home:how-it-works': HowItWorksContent
  'home:demo-form': ContactSectionContent
  'product-cms:intro-video': IntroVideoContent
  'product-cms:why': CmsWhyContent
  'product-cms:capabilities': CmsCapabilitiesContent
  'product-cms:screens': CmsScreensContent
  'product-cms:specs': SectionIntroContent
  'product-cms:pricing': SectionIntroContent
  'product-cms:use-cases': CmsUseCasesContent
  'product-cms:faq': FaqContent
  'product-cms:pricing-plans': PricingPlans
  'product-cms:spec-table': SpecTable
  'about:hero': AboutHeroContent
  'about:story': AboutStoryContent
  'about:vision': AboutVisionContent
  'about:results': AboutResultsContent
  'about:customers': SectionIntroContent
  'about:facts': AboutFactsContent
  'about:faq': FaqContent
}

export type SectionContentKey = keyof SectionContentMap

export const SECTION_CONTENT: { [K in SectionContentKey]: { schema: z.ZodType<SectionContentMap[K]>; defaults: SectionContentMap[K] } } = {
  'home:devices': { schema: DevicesContentSchema, defaults: DEVICES_DEFAULTS },
  'home:hero': { schema: HomeHeroContentSchema, defaults: HOME_HERO_DEFAULTS },
  'home:faq': { schema: FaqContentSchema, defaults: HOME_FAQ_DEFAULTS },
  'home:how-it-works': { schema: HowItWorksContentSchema, defaults: HOW_IT_WORKS_DEFAULTS },
  'home:demo-form': { schema: ContactSectionContentSchema, defaults: CONTACT_SECTION_DEFAULTS },
  'product-cms:intro-video': { schema: IntroVideoContentSchema, defaults: INTRO_VIDEO_DEFAULTS },
  'product-cms:why': { schema: CmsWhyContentSchema, defaults: CMS_WHY_DEFAULTS },
  'product-cms:capabilities': { schema: CmsCapabilitiesContentSchema, defaults: CMS_CAPABILITIES_DEFAULTS },
  'product-cms:screens': { schema: CmsScreensContentSchema, defaults: CMS_SCREENS_DEFAULTS },
  'product-cms:specs': { schema: SectionIntroSchema, defaults: CMS_SPECS_DEFAULTS },
  'product-cms:pricing': { schema: SectionIntroSchema, defaults: CMS_PRICING_DEFAULTS },
  'product-cms:use-cases': { schema: CmsUseCasesContentSchema, defaults: CMS_USE_CASES_DEFAULTS },
  'product-cms:faq': { schema: FaqContentSchema, defaults: CMS_FAQ_DEFAULTS },
  'product-cms:pricing-plans': { schema: PricingPlansSchema, defaults: PRICING_PLANS_DEFAULTS },
  'product-cms:spec-table': { schema: SpecTableSchema, defaults: SPEC_TABLE_DEFAULTS },
  'about:hero': { schema: AboutHeroContentSchema, defaults: ABOUT_HERO_DEFAULTS },
  'about:story': { schema: AboutStoryContentSchema, defaults: ABOUT_STORY_DEFAULTS },
  'about:vision': { schema: AboutVisionContentSchema, defaults: ABOUT_VISION_DEFAULTS },
  'about:results': { schema: AboutResultsContentSchema, defaults: ABOUT_RESULTS_DEFAULTS },
  'about:customers': { schema: SectionIntroSchema, defaults: ABOUT_CUSTOMERS_DEFAULTS },
  'about:facts': { schema: AboutFactsContentSchema, defaults: ABOUT_FACTS_DEFAULTS },
  'about:faq': { schema: FaqContentSchema, defaults: ABOUT_FAQ_DEFAULTS },
}

export const SECTION_CONTENT_KEYS = Object.keys(SECTION_CONTENT) as SectionContentKey[]

/** `home` + `devices` → `home:devices` when that section has editable content. */
export function sectionContentKey(page: string, section: string): SectionContentKey | null {
  const key = `${page}:${section}`
  return SECTION_CONTENT_KEYS.find((k) => k === key) ?? null
}

/** Stored content when it is valid, else the defaults from the code. */
export function resolveSectionContent<K extends SectionContentKey>(key: K, stored: unknown): SectionContentMap[K] {
  const entry = SECTION_CONTENT[key]
  if (stored === undefined || stored === null) return entry.defaults
  const parsed = entry.schema.safeParse(stored)
  return parsed.success ? parsed.data : entry.defaults
}

/** Ids of library images a piece of content uses, for "in use" checks. */
export function assetIdsIn(content: unknown): string[] {
  const ids = JSON.stringify(content ?? null).match(/"assetId":"([0-9a-f-]{36})"/g) ?? []
  return [...new Set(ids.map((m) => m.slice(11, -1)))]
}

/**
 * Columns for a row of small cards that leave no lonely card on the last row:
 * up to 6 fit on one row (6 → 6), more wrap evenly (8 → 4, 10 → 5, 12 → 6).
 * Tailwind needs whole class names, so the maps list them.
 */
const LG_COLUMNS: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
}
const XL_COLUMNS: Record<number, string> = {
  1: 'xl:grid-cols-1',
  2: 'xl:grid-cols-2',
  3: 'xl:grid-cols-3',
  4: 'xl:grid-cols-4',
  5: 'xl:grid-cols-5',
  6: 'xl:grid-cols-6',
}

export function balancedColumns(count: number) {
  if (count <= 6) return Math.max(1, count)
  // Prefer the widest layout whose last row is full, else the one with the fullest last row.
  const options = [6, 5, 4]
  const full = options.find((c) => count % c === 0)
  if (full) return full
  return options.reduce((best, c) => (count % c > count % best ? c : best))
}

export function balancedGridClass(count: number) {
  const xl = balancedColumns(count)
  // Laptops get at most 4 per row; 3 when that splits the cards evenly (6 → 3 + 3).
  let lg = Math.min(xl, 4)
  if (xl > 4 && count % 3 === 0) lg = 3
  // Tablets: two columns when three would leave one card alone (4 → 2 + 2).
  const sm = count === 2 || count === 4 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'
  return `${sm} ${LG_COLUMNS[lg] ?? 'lg:grid-cols-4'} ${XL_COLUMNS[xl] ?? 'xl:grid-cols-5'}`
}
