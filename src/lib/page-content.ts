import { pageDefaults, resolvePageContent } from '~/data/page-content'
import type { PageContent } from '~/data/page-content'
import { DEFAULT_SITE_CONFIG } from '~/lib/site-config'
import type { SiteConfig } from '~/lib/site-config'

/** A page's hero and SEO text: defaults from code with the admin's overrides applied. */
export function pageContent(config: SiteConfig, key: string): PageContent {
  const defaults = pageDefaults(key, config.products)
  if (!defaults) throw new Error(`No default content for page "${key}"`)
  return resolvePageContent(defaults, config.pages[key])
}

function isSiteConfig(value: unknown): value is SiteConfig {
  return typeof value === 'object' && value !== null && 'pages' in value && 'products' in value && 'sections' in value
}

/**
 * The site settings loaded by the root route, read inside a child route's
 * `head()` (which receives every match). Falls back to the defaults.
 */
export function siteConfigFromMatches(matches: readonly { routeId: string; loaderData?: unknown }[]): SiteConfig {
  const root = matches.find((m) => m.routeId === '__root__')
  return isSiteConfig(root?.loaderData) ? root.loaderData : DEFAULT_SITE_CONFIG
}
