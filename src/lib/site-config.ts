import type { ReactNode } from 'react'
import { PRODUCTS } from '~/content/products'
import type { Product } from '~/content/products'
import { SECTION_PAGES } from '~/data/site-sections'
import type { SectionKey, SectionPage } from '~/data/site-sections'
import type { ProductStatus } from '~/lib/enums'

/**
 * Admin-editable site settings, loaded once per request in the root route.
 * Only overrides are stored; anything missing falls back to the defaults in
 * src/data and src/content, so the site renders the same without a database.
 */
export interface SectionSetting {
  key: string
  enabled: boolean
  sortOrder: number
}

export interface PublicMetric {
  key: string
  value: number
  source: string
  asOf: string
}

export interface PublicTestimonial {
  id: string
  name: string
  role: string
  company: string
  quote: string
  uses: string[]
  avatarUrl: string | null
  rating: number | null
}

export interface MediaOverride {
  url: string
  alt: string
  width: number
  height: number
}

export interface SiteConfig {
  sections: Partial<Record<SectionPage, SectionSetting[]>>
  products: Record<string, ProductStatus>
  metrics: PublicMetric[]
  testimonials: PublicTestimonial[]
  media: Record<string, MediaOverride>
}

export const DEFAULT_SITE_CONFIG: SiteConfig = { sections: {}, products: {}, metrics: [], testimonials: [], media: {} }

/**
 * Sample content (placeholder stats, quotes, results) renders only in the dev
 * server, so it can be reviewed but never reaches the public site.
 */
export const SHOW_SAMPLE_CONTENT = import.meta.env.DEV

/** Section keys of a page in display order, hidden ones removed. */
export function resolveSections<P extends SectionPage>(config: SiteConfig, page: P): SectionKey<P>[] {
  const overrides = new Map((config.sections[page] ?? []).map((s) => [s.key, s]))
  return SECTION_PAGES[page].sections
    .map((def, index) => {
      const o = overrides.get(def.key)
      const locked = 'locked' in def && def.locked
      return { key: def.key as SectionKey<P>, enabled: locked || (o?.enabled ?? true), order: o?.sortOrder ?? index }
    })
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order)
    .map((s) => s.key)
}

export function isSectionEnabled<P extends SectionPage>(config: SiteConfig, page: P, key: SectionKey<P>) {
  return resolveSections(config, page).includes(key)
}

/** Renders the sections of a page in the admin's order; missing entries are skipped. */
export function orderSections<P extends SectionPage>(
  config: SiteConfig,
  page: P,
  elements: Partial<Record<SectionKey<P>, ReactNode>>,
): { key: string; node: ReactNode }[] {
  return resolveSections(config, page).flatMap((key) => {
    const node = elements[key]
    return node ? [{ key, node }] : []
  })
}

export function productStatus(config: SiteConfig, product: Product): ProductStatus {
  return config.products[product.slug] ?? product.status
}

/** Products with the admin's status applied; hidden products are left out. */
export function visibleProducts(config: SiteConfig): (Product & { status: 'available' | 'coming-soon' })[] {
  return PRODUCTS.flatMap((p) => {
    const status = productStatus(config, p)
    return status === 'hidden' ? [] : [{ ...p, status }]
  })
}
