import { PRODUCTS, PRODUCT_ONE_LINERS } from '~/content/products'
import { USE_CASES } from '~/content/useCases'
import { CUSTOMER_SERVER, TERM_PLANS, formatUsd } from '~/data/pricing'
import type { ProductStatus } from '~/lib/enums'
import { productSeo, useCaseSeo } from '~/lib/seo/page-seo'

/**
 * Default hero text and search snippet for every page listed in /admin/seo. The
 * admin can override the search snippet (stored in `page_overrides`); an empty
 * override falls back to these. Hero text is edited here only. Keep the
 * wording here, not in the route files.
 */
export interface PageHero {
  eyebrow?: string
  title: string
  /** Second part of the heading, styled per page (gradient, or a muted second line on About). */
  highlight?: string
  description?: string
}

export interface PageContent {
  seo: { title: string; description: string }
  hero: PageHero
}

/** What the admin saved; every field optional, empty means "use the default". */
export interface PageOverride {
  seoTitle?: string | null
  seoDescription?: string | null
}

/** The figures the /pricing page quotes; the published prices come from /admin/pages. */
export interface PricingFigures {
  yearly: number
  bestSave: number
  minLicences: number
}

const DEFAULT_FIGURES: PricingFigures = {
  yearly: TERM_PLANS[0]?.price ?? 0,
  bestSave: Math.max(0, ...TERM_PLANS.map((p) => p.save ?? 0)),
  minLicences: CUSTOMER_SERVER.minLicences,
}

function pricingPage({ yearly: price, bestSave, minLicences }: PricingFigures): PageContent {
  const yearly = formatUsd(price)
  return {
    seo: {
      title: `Viewixsoft CMS Pricing: ${yearly} per Screen per Year`,
      description: `Viewixsoft CMS costs ${yearly} per screen licence per year, with up to ${bestSave}% off on longer plans. Self-host from ${minLicences} screens or ask for a quote.`,
    },
    hero: {
      eyebrow: 'Pricing',
      title: 'Simple per-screen pricing for',
      highlight: 'Viewixsoft CMS',
      description: `You pay ${yearly} per screen licence per year. Longer plans save up to ${bestSave}%, and networks of ${minLicences} or more screens can host Viewixsoft CMS on their own server.`,
    },
  }
}

const STATIC: Record<string, PageContent> = {
  home: {
    seo: {
      title: 'Viewixsoft — Digital Signage Software for Ad Screens',
      description:
        'Viewixsoft CMS lets you upload, schedule and publish content to every advertising screen from one cloud dashboard. POS, Tracking and NFC are coming soon.',
    },
    hero: {
      title: 'Control every advertising screen',
      highlight: 'from one platform',
      description:
        'Viewixsoft provides scalable digital signage software solutions for businesses to manage and operate digital screen networks with ease.',
    },
  },
  'use-cases': {
    seo: {
      title: 'Digital Signage Use Cases by Industry',
      description:
        'See how Viewixsoft runs screens in retail stores, restaurants, offices, hotels, hospitals and clinics: the challenge, the setup and the results.',
    },
    hero: {
      title: 'Digital signage use cases by industry',
      description:
        'See how Viewixsoft software runs screens in stores, restaurants, offices, hotels, hospitals and clinics: the challenge, the setup and the results.',
    },
  },
  blog: {
    seo: {
      title: 'Digital Signage Blog: Guides and How-Tos',
      description:
        'Guides on digital signage software: cloud CMS, POS menu boards, proof-of-play and NFC, written by the Viewixsoft team.',
    },
    hero: {
      title: 'Explore our blog',
      description: 'Practical guides on managing content, menus, proof-of-play and NFC across digital signage screens.',
    },
  },
  about: {
    seo: {
      title: 'About Viewixsoft — The Software Arm of Viewix',
      description:
        'Viewixsoft builds the software for Viewix, a Hong Kong commercial display maker. Our cloud tools help businesses run and measure their screens.',
    },
    hero: {
      title: 'Software built on',
      highlight: 'a hardware foundation',
      description:
        'Viewixsoft is the software arm of Viewix, a Hong Kong display manufacturer. We build the software that runs on the screens Viewix makes.',
    },
  },
  contact: {
    seo: {
      title: 'Contact Sales',
      description:
        'Talk to the Viewixsoft sales team about digital signage software for your screens. Get advice on setup, hardware and the right products.',
    },
    hero: {
      eyebrow: 'Contact sales',
      title: 'Talk to the',
      highlight: 'Viewixsoft team',
      description:
        "Tell us about your screens, locations and the products you need. We'll reply by email with advice on setup, hardware and the right Viewixsoft products.",
    },
  },
  'legal-privacy': {
    seo: {
      title: 'Privacy Policy',
      description:
        'Viewixsoft privacy commitments: edge data processing, strict no-facial-recognition guarantees, and GDPR/CCPA data subject rights.',
    },
    hero: {
      title: 'Privacy Policy',
      description: 'How Viewixsoft collects, processes, and protects enterprise customer and website visitor information.',
    },
  },
  'legal-terms': {
    seo: {
      title: 'Terms of Service',
      description: 'Terms and conditions governing the use of Viewixsoft digital signage platform and software licenses.',
    },
    hero: { title: 'Terms of Service', description: 'Effective as of October 2026' },
  },
  'legal-cookies': {
    seo: {
      title: 'Cookie Policy',
      description: 'How Viewixsoft uses essential cookies and cookieless privacy-friendly telemetry.',
    },
    hero: { title: 'Cookie Policy', description: 'Effective as of October 2026' },
  },
}

/** Defaults for a page; product pages depend on their current release status. */
export function pageDefaults(
  key: string,
  productStatuses: Record<string, ProductStatus> = {},
  pricing: PricingFigures = DEFAULT_FIGURES,
): PageContent | null {
  if (key === 'pricing') return pricingPage(pricing)
  const fixed = STATIC[key]
  if (fixed) return fixed

  const productSlug = key.startsWith('product-') ? key.slice('product-'.length) : null
  const product = productSlug ? PRODUCTS.find((p) => p.slug === productSlug) : undefined
  if (product) {
    const status = productStatuses[product.slug] ?? product.status
    const comingSoon = status === 'coming-soon'
    if (product.slug === 'cms' && !comingSoon) {
      return {
        seo: productSeo(product),
        hero: {
          eyebrow: 'Viewixsoft CMS',
          title: 'Why choose',
          highlight: 'Viewixsoft CMS?',
          description:
            'Viewixsoft CMS runs every advertising screen from one cloud dashboard. Connect your devices, upload media, schedule content by time and location, check analytics and see where every screen is, without visiting a single site.',
        },
      }
    }
    return {
      seo: productSeo({ ...product, status: comingSoon ? 'coming-soon' : 'available' }),
      hero: {
        eyebrow: comingSoon ? undefined : product.heroBadge,
        title: product.name,
        description: comingSoon ? PRODUCT_ONE_LINERS[product.slug] : product.tagline,
      },
    }
  }

  const useCaseSlug = key.startsWith('use-case-') ? key.slice('use-case-'.length) : null
  const useCase = useCaseSlug ? USE_CASES.find((u) => u.slug === useCaseSlug) : undefined
  if (useCase) {
    return {
      seo: useCaseSeo(useCase),
      hero: { eyebrow: `${useCase.industry} use case`, title: useCase.title, description: useCase.tagline },
    }
  }
  return null
}

const pick = (override: string | null | undefined, fallback: string | undefined) =>
  override && override.trim() !== '' ? override.trim() : fallback

/** Defaults with the admin's search snippet overrides applied field by field. */
export function resolvePageContent(defaults: PageContent, override: PageOverride | undefined): PageContent {
  if (!override) return defaults
  return {
    seo: {
      title: pick(override.seoTitle, defaults.seo.title) ?? defaults.seo.title,
      description: pick(override.seoDescription, defaults.seo.description) ?? defaults.seo.description,
    },
    hero: defaults.hero,
  }
}
