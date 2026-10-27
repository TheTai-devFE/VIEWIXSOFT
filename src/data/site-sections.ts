/**
 * Every section an admin can show, hide or reorder in /admin/site, per page.
 * Home labels match each section's eyebrow on the site, so editors can find them.
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
      { key: 'products', label: 'Our solutions' },
      { key: 'how-it-works', label: 'How it works' },
      { key: 'devices', label: 'Compatible hardware' },
      { key: 'use-cases', label: 'Industries we serve' },
      { key: 'pricing', label: 'Pricing' },
      { key: 'faq', label: 'FAQ' },
      { key: 'demo-form', label: 'Contact', locked: true },
    ],
  },
  about: {
    label: 'About',
    sections: [
      { key: 'hero', label: 'Hero', locked: true },
      { key: 'facts', label: 'At a glance' },
      { key: 'story', label: 'Our story' },
      { key: 'vision', label: 'Vision' },
      { key: 'results', label: 'Customer results', note: 'Shows use cases with verified results; sample ones never show in production.' },
      { key: 'customers', label: 'First customers', note: 'Appears once a testimonial is approved.' },
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
      { key: 'why', label: 'Hero', locked: true },
      { key: 'intro-video', label: 'Product tour', note: 'The video in the hero, under the buttons. Untick to hide it; its place in this list has no effect.' },
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

/** Public business figures shown with the vision on the About page (values live in the database). */
export const METRIC_DEFS = [
  { key: 'customers', label: 'Customers', suffix: '+' },
  { key: 'devices', label: 'Connected devices', suffix: '+' },
  { key: 'plays', label: 'Content plays', suffix: '+' },
] as const

export type MetricKey = (typeof METRIC_DEFS)[number]['key']
