import '@tanstack/react-start/server-only'
import { asc, eq } from 'drizzle-orm'
import { getDb, hasDatabase } from '~/server/db/client'
import { mediaAssets, mediaSlots, pageOverrides, sectionContent, productSettings, sectionSettings, siteMetrics, testimonials } from '~/server/db/schema'
import { errorFields, logger } from '~/server/logger'
import { METRIC_DEFS } from '~/data/site-sections'
import { DEFAULT_SITE_CONFIG } from '~/lib/site-config'
import type { SectionSetting, SiteConfig } from '~/lib/site-config'
import type { SectionPage } from '~/data/site-sections'

const TTL_MS = 30_000
let cache: { at: number; config: SiteConfig } | undefined
// One read at a time; concurrent requests share it.
let pending: Promise<SiteConfig> | undefined
// Bumped by an admin save, so a read that started before the save can't cache old settings.
let generation = 0

async function readConfig(): Promise<SiteConfig> {
  const db = getDb()
  // One batch is one HTTP round trip to Neon instead of seven; each costs ~250 ms from far regions.
  const [sections, products, metrics, quotes, media, pages, content] = await db.batch([
    db.select().from(sectionSettings),
    db.select().from(productSettings),
    db.select().from(siteMetrics),
    db.select().from(testimonials).where(eq(testimonials.approved, true)).orderBy(asc(testimonials.sortOrder)),
    db
      .select({ key: mediaSlots.key, alt: mediaSlots.alt, url: mediaAssets.url, width: mediaAssets.width, height: mediaAssets.height })
      .from(mediaSlots)
      .innerJoin(mediaAssets, eq(mediaSlots.assetId, mediaAssets.id)),
    db.select().from(pageOverrides),
    db.select().from(sectionContent),
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
    // Hero columns are no longer edited or applied; a row left with only hero
    // text is skipped so the page does not show as customized.
    pages: Object.fromEntries(
      pages
        .filter((p) => p.seoTitle || p.seoDescription)
        .map((p) => [p.key, { seoTitle: p.seoTitle, seoDescription: p.seoDescription }]),
    ),
    content: Object.fromEntries(content.map((c) => [`${c.page}:${c.sectionKey}`, c.content])),
  }
}

/** Reads the settings once, however many requests ask at the same moment. */
function refresh(): Promise<SiteConfig> {
  if (pending) return pending
  const started = generation
  const read = readConfig()
    .then((config) => {
      if (started === generation) cache = { at: Date.now(), config }
      return config
    })
    .finally(() => {
      if (pending === read) pending = undefined
    })
  pending = read
  return read
}

/**
 * Site settings for the current request, cached per isolate. Within 30
 * seconds the cache is used as is; after that it is still served at once
 * while a fresh copy loads in the background, so no visitor waits on the
 * database except the very first. The defaults are used if the database is
 * missing or failing, so an outage never takes the marketing site down.
 */
export async function loadSiteConfig(): Promise<SiteConfig> {
  if (!hasDatabase()) return DEFAULT_SITE_CONFIG
  if (cache) {
    if (Date.now() - cache.at >= TTL_MS) {
      refresh().catch((error: unknown) => logger.error('site_config.load_failed', errorFields(error)))
    }
    return cache.config
  }
  try {
    return await refresh()
  } catch (error) {
    logger.error('site_config.load_failed', errorFields(error))
    return DEFAULT_SITE_CONFIG
  }
}

/** Called after an admin save, so the next request waits for the change instead of serving the old copy. */
export function invalidateSiteConfig() {
  generation++
  cache = undefined
  pending = undefined
}
