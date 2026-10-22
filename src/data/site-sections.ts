/**
 * Every section an admin can show, hide or reorder in /admin/site, per page.
 * Order here is the default order. `locked` sections hold the page's H1 or its
 * main conversion point and can't be hidden. A section whose data is missing
 * (no video, no approved quote…) hides itself whatever its setting.
 */
export interface SectionDef {
  key: string
  label: string
  locked?: boolean
  /** Shown in the admin so editors know why an enabled section may not appear. */
  note?: string
}

export const SECTION_PAGES = {
  home: {
    label: 'Home',
    sections: [
      { key: 'hero', label: 'Hero', locked: true },
      { key: 'intro-video', label: 'Product video', note: 'Appears once a video is set in src/data/intro-video.ts.' },
      { key: 'products', label: 'Products' },
      { key: 'how-it-works', label: 'How it works' },
      { key: 'devices', label: 'Compatible devices' },
      { key: 'use-cases', label: 'Use cases' },
      { key: 'vision', label: 'Vision and stats', note: 'Stats appear once all three have a value, source and date.' },
      { key: 'pricing', label: 'Pricing summary' },
      { key: 'faq', label: 'FAQ' },
      { key: 'demo-form', label: 'Demo form', locked: true },
    ],
  },
  about: {
    label: 'About',
    sections: [
      { key: 'hero', label: 'Hero', locked: true },
      { key: 'story', label: 'Our story' },
      { key: 'foundation', label: 'Hardware foundation' },
      { key: 'customers', label: 'First customers', note: 'Appears once a testimonial is approved.' },
      { key: 'company', label: 'Company details' },
    ],
  },
  'use-case': {
    label: 'Use case pages',
    sections: [
      { key: 'results', label: 'Results numbers', note: 'Sample numbers never show in production.' },
      { key: 'challenge-solution', label: 'Challenge and solution', locked: true },
      { key: 'products', label: 'Products used' },
      { key: 'quote', label: 'Customer quote', note: 'Sample quotes never show in production.' },
      { key: 'cta', label: 'Call to action' },
    ],
  },
  'product-cms': {
    label: 'Viewixsoft CMS page',
    sections: [
      { key: 'why', label: 'Why choose', locked: true },
      { key: 'capabilities', label: 'Capabilities' },
      { key: 'screens', label: 'Screen band' },
      { key: 'specs', label: 'Specifications' },
      { key: 'pricing', label: 'Pricing' },
      { key: 'use-cases', label: 'Related use cases' },
      { key: 'faq', label: 'FAQ' },
    ],
  },
} as const satisfies Record<string, { label: string; sections: readonly SectionDef[] }>

export type SectionPage = keyof typeof SECTION_PAGES
export type SectionKey<P extends SectionPage> = (typeof SECTION_PAGES)[P]['sections'][number]['key']

export const SECTION_PAGE_KEYS = Object.keys(SECTION_PAGES) as SectionPage[]

/** Public business figures shown in the home stats strip (values live in the database). */
export const METRIC_DEFS = [
  { key: 'customers', label: 'Customers', suffix: '+' },
  { key: 'devices', label: 'Connected devices', suffix: '+' },
  { key: 'plays', label: 'Content plays', suffix: '+' },
] as const

export type MetricKey = (typeof METRIC_DEFS)[number]['key']
