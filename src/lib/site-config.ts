import type { ReactNode } from 'react'
import { PRODUCTS } from '~/content/products'
import type { Product } from '~/content/products'
import { SECTION_PAGES } from '~/data/site-sections'
import type { SectionKey, SectionPage } from '~/data/site-sections'
import type { ProductStatus } from '~/lib/enums'
import type { PageOverride } from '~/data/page-content'
import { resolveSectionContent } from '~/lib/section-content'
import type { Json } from '~/lib/section-content'

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
  /** Search snippet overrides from /admin/seo, by page key. */
  pages: Record<string, PageOverride>
  /** Edited section content by `page:section` key; read through useSectionContent, which validates it. */
  content: Record<string, Json>
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  sections: {},
  products: {},
  metrics: [],
  testimonials: [],
  media: {},
  pages: {},
  content: {},
}

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

/**
 * Products as published: the admin's status applied, hidden ones left out,
 * and the Viewixsoft CMS specification table and FAQ as edited in
 * /admin/pages, so Markdown twins and llms-full.txt match the page.
 */
export function visibleProducts(config: SiteConfig): (Product & { status: 'available' | 'coming-soon' })[] {
  return PRODUCTS.flatMap((p) => {
    const status = productStatus(config, p)
    if (status === 'hidden') return []
    return [{ ...p, ...(p.slug === 'cms' ? cmsProductContent(config) : {}), status }]
  })
}

function cmsProductContent(config: SiteConfig): Pick<Product, 'specs' | 'faq'> {
  const table = resolveSectionContent('product-cms:spec-table', config.content['product-cms:spec-table'])
  const faq = resolveSectionContent('product-cms:faq', config.content['product-cms:faq'])
  return {
    specs: table.groups.map((g) => ({
      category: g.category,
      ...(g.note ? { note: g.note } : {}),
      items: g.items.map((i) => ({ label: i.label, value: i.value })),
    })),
    faq: faq.items.map((i) => ({ question: i.question, answer: i.answer })),
  }
}
