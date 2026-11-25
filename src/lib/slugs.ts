import { z } from 'zod'
import { PRODUCTS } from '~/content/products'
import { redirectFor as staticRedirectFor } from '~/data/redirects'

/**
 * Site-wide slug management: path normalization, prefix cascading for
 * collection routes (/products, /case-studies, /blog), router rewrite helpers,
 * and 301 redirect resolution.
 */

export type SlugMap = Record<string, string>
export type RedirectMap = Record<string, string>

export interface EditableSlugPage {
  key: string
  label: string
  defaultPath: string
  group: 'collections' | 'main' | 'products' | 'filters' | 'legal'
  /** Changing a collection path cascades its prefix to all child pages. */
  isCollectionPrefix?: boolean
  /** Suggested example placeholder for filter pages whose default uses a query string. */
  examplePath?: string
}

export const COLLECTION_PREFIXES = ['/blog', '/case-studies', '/products'] as const

export const EDITABLE_SLUG_PAGES: EditableSlugPage[] = [
  {
    key: 'products',
    label: 'Danh mục Sản phẩm (prefix)',
    defaultPath: '/products',
    group: 'collections',
    isCollectionPrefix: true,
  },
  {
    key: 'use-cases',
    label: 'Case studies (danh sách & prefix)',
    defaultPath: '/case-studies',
    group: 'collections',
    isCollectionPrefix: true,
  },
  {
    key: 'blog',
    label: 'Blog (danh sách & prefix)',
    defaultPath: '/blog',
    group: 'collections',
    isCollectionPrefix: true,
  },
  { key: 'pricing', label: 'Pricing', defaultPath: '/pricing', group: 'main' },
  { key: 'about', label: 'About', defaultPath: '/about', group: 'main' },
  { key: 'contact', label: 'Contact', defaultPath: '/contact', group: 'main' },
  ...PRODUCTS.map((p) => ({
    key: `product-${p.slug}`,
    label: p.name,
    defaultPath: `/products/${p.slug}`,
    group: 'products' as const,
  })),
  ...PRODUCTS.map((p) => ({
    key: `blog-filter-${p.slug}`,
    label: `Blog · ${p.name}`,
    defaultPath: `/blog?product=${p.slug}`,
    group: 'filters' as const,
    examplePath: `/blog/${p.slug}`,
  })),
  ...PRODUCTS.map((p) => ({
    key: `use-cases-filter-${p.slug}`,
    label: `Case studies · ${p.name}`,
    defaultPath: `/case-studies?product=${p.slug}`,
    group: 'filters' as const,
    examplePath: `/case-studies/${p.slug}`,
  })),
  { key: 'legal-privacy', label: 'Privacy Policy', defaultPath: '/legal/privacy', group: 'legal' },
  { key: 'legal-terms', label: 'Terms of Service', defaultPath: '/legal/terms', group: 'legal' },
  { key: 'legal-cookies', label: 'Cookie Policy', defaultPath: '/legal/cookies', group: 'legal' },
]

export function findEditableSlugPage(key: string): EditableSlugPage | undefined {
  return EDITABLE_SLUG_PAGES.find((p) => p.key === key)
}

/** System paths that cannot be claimed by custom slugs or overridden by redirects. */
export const RESERVED_PREFIXES = [
  '/admin',
  '/api',
  '/_serverFn',
  '/design-system',
  '/media-dev',
  '/newsletter',
  '/sitemap.xml',
  '/robots.txt',
  '/llms.txt',
  '/llms-full.txt',
  '/rss.xml',
  '/favicon.svg',
  '/fonts',
  '/assets',
  '/use-cases',
] as const

/** Lowercases, trims, guarantees a leading slash, collapses duplicate slashes and drops trailing slash. */
export function normalizePath(raw: string): string {
  const trimmed = raw.trim().toLowerCase()
  if (!trimmed || trimmed === '/') return '/'
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  const collapsed = withSlash.replace(/\/+/g, '/')
  return collapsed.length > 1 ? collapsed.replace(/\/+$/, '') : '/'
}

export function isReservedPath(path: string): boolean {
  const clean = normalizePath(path)
  if (clean === '/') return true
  if (/\.(md|xml|txt|json|ico|svg|png|jpg|jpeg|webp|avif|woff2?)$/i.test(clean)) return true
  return RESERVED_PREFIXES.some((prefix) => clean === prefix || clean.startsWith(`${prefix}/`))
}

const PATH_PATTERN = /^\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/
const SEGMENT_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const CustomPathSchema = z
  .string()
  .transform(normalizePath)
  .refine((v) => v.length >= 2 && v.length <= 160, 'Đường dẫn phải từ 2 đến 160 ký tự.')
  .refine((v) => PATH_PATTERN.test(v), 'Đường dẫn chỉ gồm chữ thường a-z, số 0-9, dấu gạch ngang (-) và dấu gạch chéo (/).')
  .refine((v) => !isReservedPath(v), 'Đường dẫn này trùng với đường dẫn hệ thống và không thể dùng.')

export const SlugSegmentSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Slug không được để trống.')
  .max(120, 'Slug tối đa 120 ký tự.')
  .regex(SEGMENT_PATTERN, 'Slug chỉ gồm chữ thường a-z, số 0-9 và dấu gạch ngang (-).')

export const SavePageSlugSchema = z.object({
  pageKey: z.string().min(1),
  customPath: CustomPathSchema,
})

export const ResetPageSlugSchema = z.object({
  pageKey: z.string().min(1),
})

export const UpdateContentSlugSchema = z.object({
  kind: z.enum(['blog', 'use-case']),
  id: z.string().uuid(),
  slug: SlugSegmentSchema,
})

export const CreateRedirectSchema = z.object({
  fromPath: CustomPathSchema,
  toPath: z
    .string()
    .transform(normalizePath)
    .refine(
      (v) => v === '/' || (v.length <= 160 && PATH_PATTERN.test(v)),
      'Đường dẫn đích phải là "/" hoặc đường dẫn hợp lệ (chữ thường, số, gạch ngang).',
    ),
})

export const DeleteRedirectSchema = z.object({
  id: z.string().uuid(),
})

function splitMarkdownSuffix(path: string): { base: string; isMd: boolean } {
  if (path.endsWith('.md') && path.length > 3) {
    return { base: normalizePath(path.slice(0, -3)), isMd: true }
  }
  return { base: normalizePath(path), isMd: false }
}

/**
 * Maps an internal route path (e.g. `/pricing`, `/blog/my-post`, `/blog?product=cms`,
 * `/products/cms.md`) to its public URL path using the active slug overrides.
 *
 * Precedence:
 * 1. Exact override for the path (including query filter overrides like `/blog?product=cms`).
 * 2. Collection prefix override (e.g. `/blog` -> `/tin-tuc` turns `/blog/post` into `/tin-tuc/post`).
 */
export function toPublicPath(internalPath: string, slugMap?: SlugMap | null): string {
  if (!slugMap || Object.keys(slugMap).length === 0) return internalPath

  const qIndex = internalPath.indexOf('?')
  if (qIndex !== -1) {
    const pathname = normalizePath(internalPath.slice(0, qIndex))
    const search = internalPath.slice(qIndex)
    const exactWithQuery = slugMap[`${pathname}${search}`]
    if (exactWithQuery) return exactWithQuery
    return `${toPublicPath(pathname, slugMap)}${search}`
  }

  const { base, isMd } = splitMarkdownSuffix(internalPath)
  const suffix = isMd ? '.md' : ''

  const exact = slugMap[base]
  if (exact) return `${exact}${suffix}`

  for (const prefix of COLLECTION_PREFIXES) {
    const customPrefix = slugMap[prefix]
    if (customPrefix && base.startsWith(`${prefix}/`)) {
      return `${customPrefix}${base.slice(prefix.length)}${suffix}`
    }
  }

  return internalPath
}

/**
 * Reverse of `toPublicPath`: maps a public browser URL path back to the
 * internal file-based TanStack Router path (without query string).
 */
export function toInternalPath(publicPath: string, slugMap?: SlugMap | null): string {
  if (!slugMap || Object.keys(slugMap).length === 0) return publicPath
  const { base, isMd } = splitMarkdownSuffix(publicPath)
  const suffix = isMd ? '.md' : ''

  for (const [defaultPath, customPath] of Object.entries(slugMap)) {
    if (customPath === base) {
      const qIndex = defaultPath.indexOf('?')
      return qIndex === -1 ? `${defaultPath}${suffix}` : defaultPath
    }
  }

  for (const prefix of COLLECTION_PREFIXES) {
    const customPrefix = slugMap[prefix]
    if (customPrefix && base.startsWith(`${customPrefix}/`)) {
      return `${prefix}${base.slice(customPrefix.length)}${suffix}`
    }
  }

  return publicPath
}

/**
 * Matches an internal path + URLSearchParams against query-filter overrides in
 * `slugMap` (e.g. `/blog?product=cms` -> `/blog/cms`). Preserves any extra
 * query params such as UTM tags.
 */
function matchFilterOverride(
  internalPathname: string,
  searchParams: URLSearchParams,
  slugMap: SlugMap,
): { customPath: string; remainingParams: URLSearchParams } | null {
  for (const [defaultPath, customPath] of Object.entries(slugMap)) {
    const qIndex = defaultPath.indexOf('?')
    if (qIndex === -1) continue
    const basePath = defaultPath.slice(0, qIndex)
    if (basePath !== internalPathname) continue

    const required = new URLSearchParams(defaultPath.slice(qIndex + 1))
    let allMatch = true
    for (const [k, v] of required.entries()) {
      if (searchParams.get(k) !== v) {
        allMatch = false
        break
      }
    }
    if (!allMatch) continue

    const remainingParams = new URLSearchParams(searchParams)
    for (const k of required.keys()) remainingParams.delete(k)
    return { customPath, remainingParams }
  }
  return null
}

/**
 * Rewrites an incoming public URL (pathname + search) to its internal
 * TanStack Router URL for `createRouter({ rewrite: { input } })`.
 */
export function rewriteInputUrl(url: URL, slugMap?: SlugMap | null): URL {
  if (!slugMap || Object.keys(slugMap).length === 0) return url
  const clean = normalizePath(url.pathname)

  for (const [defaultPath, customPath] of Object.entries(slugMap)) {
    if (customPath !== clean) continue
    const qIndex = defaultPath.indexOf('?')
    if (qIndex === -1) {
      url.pathname = defaultPath
      return url
    }
    url.pathname = defaultPath.slice(0, qIndex)
    const injected = new URLSearchParams(defaultPath.slice(qIndex + 1))
    for (const [k, v] of injected.entries()) {
      if (!url.searchParams.has(k)) url.searchParams.set(k, v)
    }
    return url
  }

  const rewritten = toInternalPath(url.pathname, slugMap)
  if (rewritten !== url.pathname) url.pathname = rewritten
  return url
}

/**
 * Rewrites an internal TanStack Router URL (pathname + search) to its public
 * URL for `createRouter({ rewrite: { output } })`.
 */
export function rewriteOutputUrl(url: URL, slugMap?: SlugMap | null): URL {
  if (!slugMap || Object.keys(slugMap).length === 0) return url
  const clean = normalizePath(url.pathname)

  if (url.search) {
    const filterMatch = matchFilterOverride(clean, url.searchParams, slugMap)
    if (filterMatch) {
      url.pathname = filterMatch.customPath
      const rest = filterMatch.remainingParams.toString()
      url.search = rest ? `?${rest}` : ''
      return url
    }
  }

  const rewritten = toPublicPath(url.pathname, slugMap)
  if (rewritten !== url.pathname) url.pathname = rewritten
  return url
}

/**
 * Resolves whether an incoming request pathname (and optional search string)
 * should 301-redirect, returning the final public target (pathname + optional
 * query, single hop, loop-safe) or `null` if live.
 */
export function resolveRedirect(
  pathname: string,
  slugMap: SlugMap = {},
  dbRedirects: RedirectMap = {},
  search = '',
): string | null {
  const { base, isMd } = splitMarkdownSuffix(pathname)
  if (base === '/' || isSystemBypass(base)) return null
  const suffix = isMd ? '.md' : ''

  // 1. Static legacy redirects from src/data/redirects.ts (e.g. /use-cases -> /case-studies).
  const staticHit = staticRedirectFor(isMd ? `${base}.md` : base)
  if (staticHit) {
    const target = toPublicPath(staticHit, slugMap)
    return target !== base ? `${target}${search}` : null
  }

  // 2. Dynamic DB redirects (check both exact public path and its internal equivalent
  //    so blog/case-study slug redirects still work after their collection prefix changes).
  const internalEquiv = toInternalPath(base, slugMap)
  const direct = dbRedirects[base] ?? (internalEquiv !== base ? dbRedirects[internalEquiv] : undefined)
  if (direct) {
    let cursor = direct
    const seen = new Set<string>([base, internalEquiv])
    while (dbRedirects[cursor] && !seen.has(dbRedirects[cursor])) {
      seen.add(cursor)
      cursor = dbRedirects[cursor]
    }
    const finalTarget = toPublicPath(cursor, slugMap)
    if (finalTarget !== base) {
      const targetWithSuffix = finalTarget === '/' ? '/' : `${finalTarget}${suffix}`
      return search && !targetWithSuffix.includes('?') ? `${targetWithSuffix}${search}` : targetWithSuffix
    }
  }

  // 3. Query-filter override: e.g. /blog?product=cms (or /tin-tuc?product=cms) -> /blog/cms.
  if (search && !isMd) {
    const params = new URLSearchParams(search)
    const internalBase = internalEquiv.includes('?') ? internalEquiv.slice(0, internalEquiv.indexOf('?')) : internalEquiv
    const filterMatch = matchFilterOverride(internalBase, params, slugMap)
    if (filterMatch && filterMatch.customPath !== base) {
      const rest = filterMatch.remainingParams.toString()
      return rest ? `${filterMatch.customPath}?${rest}` : filterMatch.customPath
    }
  }

  // 4. Old default path of a page/collection that now has a custom slug.
  //    Only redirect if `base` is not currently claimed as another page's custom path.
  if (internalEquiv === base) {
    const pub = toPublicPath(base, slugMap)
    if (pub !== base) return `${pub}${suffix}${search}`
  }

  return null
}

function isSystemBypass(cleanPath: string): boolean {
  return RESERVED_PREFIXES.some((prefix) => {
    // Allow /use-cases to fall through to static legacy redirects.
    if (prefix === '/use-cases') return false
    return cleanPath === prefix || cleanPath.startsWith(`${prefix}/`)
  })
}

// ─── Active slug map bridge (SSR + client hydration) ─────────────────────────

declare global {
  interface Window {
    __VIEWIX_SLUGS__?: SlugMap
  }
}

let activeSlugMap: SlugMap = {}

export function setActiveSlugMap(map: SlugMap) {
  activeSlugMap = map
  if (typeof window !== 'undefined') {
    window.__VIEWIX_SLUGS__ = map
  }
}

export function getActiveSlugMap(): SlugMap {
  if (typeof window !== 'undefined' && window.__VIEWIX_SLUGS__) {
    return window.__VIEWIX_SLUGS__
  }
  return activeSlugMap
}

/** Inline boot script emitted in `<head>` so client hydration knows custom slugs before router init. */
export function serializeSlugBootScript(slugMap: SlugMap): string {
  const safeJson = JSON.stringify(slugMap)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
  return `window.__VIEWIX_SLUGS__=${safeJson};`
}
