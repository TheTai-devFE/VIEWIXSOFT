import { PRODUCTS } from '~/content/products'
import { USE_CASES } from '~/content/useCases'
import type { SectionPage } from '~/data/site-sections'

/** Short sidebar names for use case pages; falls back to the industry. */
const USE_CASE_LABELS: Record<string, string> = {
  retail: 'Retail',
  'qsr-menu-boards': 'QSR menu boards',
  'corporate-comms': 'Corporate',
  hospitality: 'Hospitality',
  healthcare: 'Healthcare',
}

/**
 * Every public page an admin can open in /admin/pages, grouped as in the
 * sidebar. `key` is the URL segment (/admin/pages/<key>). `sections` names the
 * section set the page uses; pages built from one template share it.
 */
export interface AdminPage {
  key: string
  label: string
  /** Public URL of the page. */
  path: string
  sections?: SectionPage
}

export interface AdminPageGroup {
  id: 'main' | 'products' | 'use-cases' | 'legal'
  label: string
  pages: AdminPage[]
}

export const ADMIN_PAGE_GROUPS: AdminPageGroup[] = [
  {
    id: 'main',
    label: 'Main pages',
    pages: [
      { key: 'home', label: 'Home', path: '/', sections: 'home' },
      { key: 'use-cases', label: 'Use cases', path: '/use-cases' },
      { key: 'pricing', label: 'Pricing', path: '/pricing' },
      { key: 'blog', label: 'Blog', path: '/blog' },
      { key: 'about', label: 'About', path: '/about', sections: 'about' },
      { key: 'contact', label: 'Contact', path: '/contact' },
    ],
  },
  {
    id: 'products',
    label: 'Products',
    pages: PRODUCTS.map((p) => ({
      key: `product-${p.slug}`,
      label: p.name,
      path: `/products/${p.slug}`,
      ...(p.slug === 'cms' ? { sections: 'product-cms' as const } : {}),
    })),
  },
  {
    id: 'use-cases',
    label: 'Use cases',
    pages: USE_CASES.map((u) => ({
      key: `use-case-${u.slug}`,
      label: USE_CASE_LABELS[u.slug] ?? u.industry,
      path: `/use-cases/${u.slug}`,
      sections: 'use-case' as const,
    })),
  },
  {
    id: 'legal',
    label: 'Legal',
    pages: [
      { key: 'legal-privacy', label: 'Privacy Policy', path: '/legal/privacy' },
      { key: 'legal-terms', label: 'Terms of Service', path: '/legal/terms' },
      { key: 'legal-cookies', label: 'Cookie Policy', path: '/legal/cookies' },
    ],
  },
]

export const ADMIN_PAGES: AdminPage[] = ADMIN_PAGE_GROUPS.flatMap((g) => g.pages)

export function findAdminPage(key: string) {
  for (const group of ADMIN_PAGE_GROUPS) {
    const page = group.pages.find((p) => p.key === key)
    if (page) return { group, page }
  }
  return null
}

/** Other pages sharing this page's section set (e.g. every use case). */
export function pagesSharingSections(page: AdminPage) {
  return page.sections ? ADMIN_PAGES.filter((p) => p.sections === page.sections && p.key !== page.key) : []
}
