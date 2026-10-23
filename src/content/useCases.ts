export interface UseCase {
  slug: string
  title: string
  /** Search title, at most 47 characters so "Title — Viewixsoft" fits in 60. */
  seoTitle: string
  industry: string
  /** Question-style H2s for the challenge and solution sections. */
  challengeHeading: string
  solutionHeading: string
  publishedAt: string
  updatedAt: string
  /** `sample` results and quote render only in the dev server; set `verified` for real, approved ones. */
  evidence: 'sample' | 'verified'
  /** 16:9 card image; TODO(content): swap the shared stock photos for real deployment photos. */
  cover: { src: string; alt: string }
  tagline: string
  challenge: string
  solution: string
  results: { metric: string; label: string }[]
  featuredProducts: { name: string; slug: string }[]
  quote: {
    text: string
    author: string
    title: string
    company: string
  }
}

/**
 * TODO(content): SAMPLE DATA. The deployments, `results` numbers and `quote`
 * people/companies below are placeholders written for layout review. Replace
 * them with real, approved customer stories (or remove the results and quote)
 * before launch. Several stories also use Viewixsoft POS, Tracking and NFC,
 * which are not released yet.
 */
export const USE_CASES: UseCase[] = [
  {
    slug: 'retail',
    title: 'Retail & Shopping Centers',
    seoTitle: 'Digital Signage for Retail Stores',
    industry: 'Retail',
    challengeHeading: 'Why does paper signage hold retail promotions back?',
    solutionHeading: 'How does Viewixsoft run retail screens from one place?',
    publishedAt: '2026-10-15',
    updatedAt: '2026-10-22',
    evidence: 'sample',
    cover: { src: '/devices/stock/retail-screens.webp', alt: 'Retail store wall with several portrait screens' },
    tagline: 'Transform retail foot traffic into measurable omnichannel sales with interactive storefronts and shelf displays.',
    challenge: 'Retailers struggled with static paper signage that was costly to print and impossible to synchronize with weekly flash sales and local stock levels across hundreds of branches.',
    solution: 'Viewixsoft CMS and NFC were deployed across 450 flagship stores, powering dynamic 4K window displays, digital endcap screens, and NFC-enabled tap-to-buy shelf tags.',
    results: [
      { metric: '+34%', label: 'Increase in featured product sales' },
      { metric: '99.98%', label: 'Screen fleet uptime across 4,200 displays' },
      { metric: '< 2 min', label: 'Nationwide promotional campaign launch time' }
    ],
    featuredProducts: [
      { name: 'Viewixsoft CMS', slug: 'cms' },
      { name: 'Viewixsoft NFC', slug: 'nfc' }
    ],
    quote: {
      text: 'Viewixsoft replaced our archaic USB stick updates with an automated cloud network that turns storefront displays into direct revenue drivers.',
      author: 'Marcus Vance',
      title: 'VP of Global Retail Operations',
      company: 'Aura Fashion Brands'
    }
  },
  {
    slug: 'qsr-menu-boards',
    title: 'Restaurants & Digital Menu Boards',
    seoTitle: 'Digital Menu Boards for Restaurants and QSR',
    industry: 'Food & Beverage',
    challengeHeading: 'Why do menu board prices drift from the register?',
    solutionHeading: 'How does Viewixsoft keep menu boards in sync?',
    publishedAt: '2026-10-15',
    updatedAt: '2026-10-22',
    evidence: 'sample',
    cover: { src: '/devices/stock/digital-menu-boards.webp', alt: 'Row of digital menu boards above a food counter' },
    tagline: 'Synchronize menus, prices, and drive-thru boards automatically with your kitchen POS in under 250 milliseconds.',
    challenge: 'Quick-service restaurant chains face heavy compliance penalties when prices on digital boards differ from registers, and manual item 86-ing causes customer frustration in drive-thru lanes.',
    solution: 'Viewixsoft POS and CMS integrated directly with kitchen management systems, automatically alternating breakfast/lunch menus and hiding sold-out items across 600 drive-thru locations.',
    results: [
      { metric: '100%', label: 'Price accuracy compliance across all locations' },
      { metric: '+18%', label: 'High-margin combo meal upsell conversion' },
      { metric: '14s', label: 'Reduction in average drive-thru lane wait time' }
    ],
    featuredProducts: [
      { name: 'Viewixsoft POS', slug: 'pos' },
      { name: 'Viewixsoft CMS', slug: 'cms' }
    ],
    quote: {
      text: 'Our menu boards now intelligently promote surplus ingredients and update prices instantly across 1,200 screens without a single manual intervention.',
      author: 'Elena Gomez',
      title: 'Chief Technology Officer',
      company: 'BurgerCraft International'
    }
  },
  {
    slug: 'corporate-comms',
    title: 'Offices & Corporate Campuses',
    seoTitle: 'Digital Signage for Corporate Communications',
    industry: 'Corporate',
    challengeHeading: 'Why do company updates miss hybrid teams?',
    solutionHeading: 'How does Viewixsoft reach every office screen?',
    publishedAt: '2026-10-15',
    updatedAt: '2026-10-22',
    evidence: 'sample',
    cover: { src: '/devices/stock/menu-stand.webp', alt: 'Portrait screen showing the daily menu in an office canteen' },
    tagline: 'Unify employee engagement, live executive town halls, and real-time KPI dashboards across global offices.',
    challenge: 'Hybrid workforce models left multinational offices feeling disconnected, with email newsletters suffering under 20% open rates.',
    solution: 'Viewixsoft CMS deployed across video walls, cafeteria displays, and elevator screens, broadcasting live company metrics, Slack celebrations, and emergency alert takeovers.',
    results: [
      { metric: '3.8x', label: 'Higher employee awareness of key strategic goals' },
      { metric: '10 sec', label: 'Campus-wide emergency evacuation broadcast takeover' },
      { metric: '12', label: 'Global corporate headquarters synchronized' }
    ],
    featuredProducts: [
      { name: 'Viewixsoft CMS', slug: 'cms' },
      { name: 'Viewixsoft Tracking', slug: 'tracking' }
    ],
    quote: {
      text: 'The ability to push emergency warnings instantaneously and keep our global offices unified around quarterly goals has made Viewixsoft indispensable to our workplace ops.',
      author: 'David Sterling',
      title: 'Head of Global Facilities',
      company: 'OmniFin Technology Group'
    }
  },
  {
    slug: 'hospitality',
    title: 'Hotels & Resorts',
    seoTitle: 'Digital Signage for Hotels and Resorts',
    industry: 'Hospitality',
    challengeHeading: 'Why do guests miss what a hotel offers?',
    solutionHeading: 'How does Viewixsoft turn hotel screens into a concierge?',
    publishedAt: '2026-10-15',
    updatedAt: '2026-10-22',
    evidence: 'sample',
    cover: { src: '/devices/stock/bar-menu-screens.webp', alt: 'Bar with a wall of digital menu screens' },
    tagline: 'Deliver curated guest experiences, digital concierge wayfinding, and contactless amenity reservations.',
    challenge: 'Luxury hotels needed visually stunning, branded digital displays that complemented boutique architecture without looking like sterile commercial screens.',
    solution: 'Viewixsoft CMS combined with Viewixsoft NFC delivered custom ambient artwork, interactive event schedules, and tap-to-reserve poolside cabanas.',
    results: [
      { metric: '+52%', label: 'Spa & dining booking conversions from lobby kiosks' },
      { metric: '4.9/5', label: 'Guest satisfaction score for in-lobby navigation' },
      { metric: '28', label: 'Luxury hotel and resort properties equipped' }
    ],
    featuredProducts: [
      { name: 'Viewixsoft CMS', slug: 'cms' },
      { name: 'Viewixsoft NFC', slug: 'nfc' }
    ],
    quote: {
      text: 'Our guests appreciate the seamless luxury aesthetic. Tapping their phone on a lobby screen to book dinner or receive directions feels like pure magic.',
      author: 'Julian Moreau',
      title: 'VP of Guest Innovation',
      company: 'Solstice Hotels & Resorts'
    }
  },
  {
    slug: 'healthcare',
    title: 'Hospitals & Clinics',
    seoTitle: 'Digital Signage for Hospitals and Clinics',
    industry: 'Healthcare',
    challengeHeading: 'Why do patients miss updates in busy clinics?',
    solutionHeading: 'How does Viewixsoft keep clinic screens current?',
    publishedAt: '2026-10-22',
    updatedAt: '2026-10-22',
    evidence: 'sample',
    // TODO(content): replace with a real photo of screens in a hospital or clinic (upload it in /admin/media).
    cover: { src: '/devices/stock/tablet-kiosk.webp', alt: 'Tablet kiosk on a counter with a customer paying by phone' },
    tagline: 'Keep waiting rooms, reception desks and corridors up to date with schedules, directions and health notices.',
    // TODO(content): general description only; confirm it against a real healthcare deployment before launch.
    challenge:
      'Hospitals and clinics change opening hours, doctor schedules and health notices often, and printed posters in waiting areas and corridors go out of date quickly.',
    solution:
      'Viewixsoft CMS groups the screens in each building and area, so staff can schedule playlists for waiting rooms, reception and corridors, check what every screen shows with remote screenshots, and follow the network in overview reports.',
    // TODO(content): no results yet. Add real, approved figures and set `evidence: 'verified'`.
    results: [],
    featuredProducts: [{ name: 'Viewixsoft CMS', slug: 'cms' }],
    // TODO(content): sample placeholder, shown in the dev server only.
    quote: {
      text: 'Sample quote. Replace it with an approved quote from a healthcare customer.',
      author: 'Sample name',
      title: 'Sample role',
      company: 'Sample clinic',
    },
  }
]
