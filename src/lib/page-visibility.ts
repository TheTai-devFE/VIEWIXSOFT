import type { SiteConfig } from '~/lib/site-config'

export type PageVisibilityMap = Record<string, boolean>

/**
 * Maps a site path (e.g. '/pricing', '/case-studies') to its page key.
 * Keys must match ADMIN_PAGES in ~/data/admin-pages, since that is what the admin toggle saves.
 */
export function pathToPageKey(path: string): string {
  const clean = path.replace(/\/$/, '')
  switch (clean) {
    case '':
    case '/':
      return 'home'
    case '/case-studies':
    case '/use-cases':
      return 'use-cases'
    case '/pricing':
      return 'pricing'
    case '/blog':
      return 'blog'
    case '/about':
      return 'about'
    case '/contact':
      return 'contact'
    case '/legal/privacy':
      return 'legal-privacy'
    case '/legal/terms':
      return 'legal-terms'
    case '/legal/cookies':
      return 'legal-cookies'
  }
  const detail = /^\/(products|case-studies|use-cases)\/([^/]+)$/.exec(clean)
  if (detail?.[2]) return detail[1] === 'products' ? `product-${detail[2]}` : `use-case-${detail[2]}`
  return clean.replace(/^\//, '').replace(/\//g, '-')
}

/**
 * Returns the page visibility map from SiteConfig.
 * Empty or undefined keys default to true (visible).
 */
export function getPageVisibility(config?: SiteConfig | null): PageVisibilityMap {
  if (!config?.content) return {}
  const raw = config.content['global:page_visibility']
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as PageVisibilityMap
  }
  return {}
}

/**
 * Checks whether a specific page is visible.
 * Home is permanently locked to visible.
 * Other pages default to visible unless explicitly set to false in admin.
 */
export function isPageVisible(config: SiteConfig | undefined | null, pageKeyOrPath: string): boolean {
  const key = pageKeyOrPath.startsWith('/') ? pathToPageKey(pageKeyOrPath) : pageKeyOrPath
  if (key === 'home') return true
  const map = getPageVisibility(config)
  // Hiding the case studies index hides every case study under it too.
  if (key.startsWith('use-case-') && map['use-cases'] === false) return false
  return map[key] !== false
}
