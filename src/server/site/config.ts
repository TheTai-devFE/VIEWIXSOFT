import '@tanstack/react-start/server-only'
import { asc, eq } from 'drizzle-orm'
import { getDb, hasDatabase } from '~/server/db/client'
import { mediaSlots, pageOverrides, productSettings, sectionSettings, siteMetrics, testimonials } from '~/server/db/schema'
import { errorFields, logger } from '~/server/logger'
import { METRIC_DEFS } from '~/data/site-sections'
import { DEFAULT_SITE_CONFIG } from '~/lib/site-config'
import type { SectionSetting, SiteConfig } from '~/lib/site-config'
import type { SectionPage } from '~/data/site-sections'

const TTL_MS = 30_000
let cache: { at: number; config: SiteConfig } | undefined

async function readConfig(): Promise<SiteConfig> {
  const db = getDb()
  const [sections, products, metrics, quotes, media, pages] = await Promise.all([
    db.select().from(sectionSettings),
    db.select().from(productSettings),
    db.select().from(siteMetrics),
    db.select().from(testimonials).where(eq(testimonials.approved, true)).orderBy(asc(testimonials.sortOrder)),
    db.select().from(mediaSlots),
    db.select().from(pageOverrides),
  ])

  const byPage: Partial<Record<SectionPage, SectionSetting[]>> = {}
  for (const s of sections) {
    const page = s.page as SectionPage
    ;(byPage[page] ??= []).push({ key: s.sectionKey, enabled: s.enabled, sortOrder: s.sortOrder })
  }

  const known = new Set<string>(METRIC_DEFS.map((m) => m.key))
  return {
    sections: byPage,
    products: Object.fromEntries(products.map((p) => [p.slug, p.status])),
    metrics: metrics
      .filter((m) => known.has(m.key))
      .map((m) => ({ key: m.key, value: m.value, source: m.source, asOf: m.asOf })),
    // A quote shows only with recorded consent, on top of the approval flag.
    testimonials: quotes
      .filter((t) => t.consentAt)
      .map((t) => ({
        id: t.id,
        name: t.name,
        role: t.role,
        company: t.company,
        quote: t.quote,
        uses: t.uses,
        avatarUrl: t.avatarUrl,
        rating: t.rating,
      })),
    media: Object.fromEntries(media.map((m) => [m.key, { url: m.url, alt: m.alt, width: m.width, height: m.height }])),
    pages: Object.fromEntries(
      pages.map((p) => [
        p.key,
        {
          seoTitle: p.seoTitle,
          seoDescription: p.seoDescription,
          heroEyebrow: p.heroEyebrow,
          heroTitle: p.heroTitle,
          heroHighlight: p.heroHighlight,
          heroDescription: p.heroDescription,
        },
      ]),
    ),
  }
}

/**
 * Site settings for the current request. Cached per isolate for 30 seconds,
 * and the defaults are used if the database is missing or failing, so a
 * database outage never takes the marketing site down.
 */
export async function loadSiteConfig(): Promise<SiteConfig> {
  if (!hasDatabase()) return DEFAULT_SITE_CONFIG
  if (cache && Date.now() - cache.at < TTL_MS) return cache.config
  try {
    const config = await readConfig()
    cache = { at: Date.now(), config }
    return config
  } catch (error) {
    logger.error('site_config.load_failed', errorFields(error))
    return cache?.config ?? DEFAULT_SITE_CONFIG
  }
}

/** Called after an admin save so this isolate shows the change at once. */
export function invalidateSiteConfig() {
  cache = undefined
}
