import { describe, expect, it } from 'vitest'
import {
  CustomPathSchema,
  SlugSegmentSchema,
  isReservedPath,
  normalizePath,
  resolveRedirect,
  rewriteInputUrl,
  rewriteOutputUrl,
  serializeSlugBootScript,
  toInternalPath,
  toPublicPath,
} from '~/lib/slugs'
import { DEFAULT_SITE_CONFIG } from '~/lib/site-config'
import { buildLlmsTxt, buildRssXml, sitemapEntries } from '~/lib/seo/generators'

describe('slug normalization and validation', () => {
  it('normalizes leading/trailing slashes, duplicate slashes and casing', () => {
    expect(normalizePath('  /Bang-Gia/  ')).toBe('/bang-gia')
    expect(normalizePath('about///')).toBe('/about')
    expect(normalizePath('/')).toBe('/')
  })

  it('rejects reserved system paths and file extensions', () => {
    expect(isReservedPath('/')).toBe(true)
    expect(isReservedPath('/admin')).toBe(true)
    expect(isReservedPath('/admin/slugs')).toBe(true)
    expect(isReservedPath('/api/v1/posts')).toBe(true)
    expect(isReservedPath('/sitemap.xml')).toBe(true)
    expect(isReservedPath('/about.md')).toBe(true)
    expect(isReservedPath('/bang-gia')).toBe(false)
  })

  it('validates custom paths and content slug segments with Zod', () => {
    expect(CustomPathSchema.parse('/Bang-Gia/')).toBe('/bang-gia')
    expect(CustomPathSchema.safeParse('/admin/test').success).toBe(false)
    expect(CustomPathSchema.safeParse('/bad path').success).toBe(false)
    expect(SlugSegmentSchema.parse('My-Post-123')).toBe('my-post-123')
    expect(SlugSegmentSchema.safeParse('a/b').success).toBe(false)
  })
})

describe('toPublicPath and toInternalPath', () => {
  const slugMap = {
    '/pricing': '/bang-gia',
    '/blog': '/tin-tuc',
    '/products': '/san-pham',
    '/products/cms': '/phan-mem-cms',
  }

  it('rewrites exact page paths and cascades collection prefixes to child pages', () => {
    expect(toPublicPath('/pricing', slugMap)).toBe('/bang-gia')
    expect(toPublicPath('/blog', slugMap)).toBe('/tin-tuc')
    expect(toPublicPath('/blog/my-post', slugMap)).toBe('/tin-tuc/my-post')
    expect(toPublicPath('/blog/my-post.md', slugMap)).toBe('/tin-tuc/my-post.md')
    expect(toPublicPath('/products/pos', slugMap)).toBe('/san-pham/pos')
    // Exact product override takes precedence over collection prefix.
    expect(toPublicPath('/products/cms', slugMap)).toBe('/phan-mem-cms')
    expect(toPublicPath('/products/cms.md', slugMap)).toBe('/phan-mem-cms.md')
    // Untouched pages remain unchanged.
    expect(toPublicPath('/about', slugMap)).toBe('/about')
  })

  it('reverses public paths back to internal file routes', () => {
    expect(toInternalPath('/bang-gia', slugMap)).toBe('/pricing')
    expect(toInternalPath('/tin-tuc', slugMap)).toBe('/blog')
    expect(toInternalPath('/tin-tuc/my-post', slugMap)).toBe('/blog/my-post')
    expect(toInternalPath('/tin-tuc/my-post.md', slugMap)).toBe('/blog/my-post.md')
    expect(toInternalPath('/san-pham/pos', slugMap)).toBe('/products/pos')
    expect(toInternalPath('/phan-mem-cms', slugMap)).toBe('/products/cms')
    expect(toInternalPath('/phan-mem-cms.md', slugMap)).toBe('/products/cms.md')
  })
})

describe('resolveRedirect', () => {
  const slugMap = {
    '/pricing': '/bang-gia',
    '/blog': '/tin-tuc',
    '/case-studies': '/du-an',
  }
  const dbRedirects = {
    '/blog/old-post': '/blog/new-post',
    '/legacy-promo': '/pricing',
  }

  it('301-redirects old default paths and cascaded child paths to their new public paths', () => {
    expect(resolveRedirect('/pricing', slugMap, dbRedirects)).toBe('/bang-gia')
    expect(resolveRedirect('/blog/hello', slugMap, dbRedirects)).toBe('/tin-tuc/hello')
    expect(resolveRedirect('/blog/hello.md', slugMap, dbRedirects)).toBe('/tin-tuc/hello.md')
    // Live custom paths do not redirect.
    expect(resolveRedirect('/bang-gia', slugMap, dbRedirects)).toBeNull()
    expect(resolveRedirect('/tin-tuc/hello', slugMap, dbRedirects)).toBeNull()
  })

  it('resolves DB redirects in a single hop even when the collection prefix also changed', () => {
    expect(resolveRedirect('/blog/old-post', slugMap, dbRedirects)).toBe('/tin-tuc/new-post')
    expect(resolveRedirect('/tin-tuc/old-post', slugMap, dbRedirects)).toBe('/tin-tuc/new-post')
    expect(resolveRedirect('/legacy-promo', slugMap, dbRedirects)).toBe('/bang-gia')
  })

  it('maps legacy static redirects through custom collection prefixes', () => {
    expect(resolveRedirect('/use-cases', slugMap, dbRedirects)).toBe('/du-an')
  })

  it('never redirects reserved system routes or creates loops', () => {
    expect(resolveRedirect('/admin/slugs', slugMap, dbRedirects)).toBeNull()
    expect(resolveRedirect('/sitemap.xml', slugMap, dbRedirects)).toBeNull()
    expect(resolveRedirect('/a', {}, { '/a': '/b', '/b': '/a' })).toBe('/b')
  })
})

describe('SEO generators and boot script with custom slugs', () => {
  it('uses custom slugs in sitemap.xml, llms.txt and rss.xml', () => {
    const slugs = { '/pricing': '/bang-gia', '/blog': '/tin-tuc' }
    const config = { ...DEFAULT_SITE_CONFIG, slugs }

    const entries = sitemapEntries(undefined, config)
    expect(entries.some((e) => e.path === '/bang-gia')).toBe(true)
    expect(entries.some((e) => e.path === '/pricing')).toBe(false)
    expect(entries.some((e) => e.path === '/tin-tuc')).toBe(true)

    const llms = buildLlmsTxt(undefined, undefined, slugs)
    expect(llms).toContain('https://viewixsoft.com/bang-gia')
    expect(llms).not.toContain('https://viewixsoft.com/pricing')

    const rss = buildRssXml(undefined, slugs)
    expect(rss).toContain('<link>https://viewixsoft.com/tin-tuc</link>')
  })

  it('escapes HTML-unsafe characters in the inline boot script', () => {
    const script = serializeSlugBootScript({ '/pricing': '/bang-gia' })
    expect(script).toBe('window.__VIEWIX_SLUGS__={"/pricing":"/bang-gia"};')
    expect(serializeSlugBootScript({ '/a': '</script>' })).not.toContain('</script>')
  })
})

describe('query-filter slug rewrite, 301 redirect and sitemap', () => {
  const slugMap = {
    '/blog': '/tin-tuc',
    '/blog?product=cms': '/tin-tuc-cms',
    '/case-studies?product=pos': '/case-studies/pos',
  }

  it('rewrites internal filter links to clean custom paths while preserving extra query params', () => {
    const out1 = rewriteOutputUrl(new URL('https://viewixsoft.com/blog?product=cms'), slugMap)
    expect(out1.pathname).toBe('/tin-tuc-cms')
    expect(out1.search).toBe('')

    const out2 = rewriteOutputUrl(new URL('https://viewixsoft.com/blog?product=cms&utm_source=fb'), slugMap)
    expect(out2.pathname).toBe('/tin-tuc-cms')
    expect(out2.search).toBe('?utm_source=fb')

    // Uncustomized filter still inherits renamed collection prefix.
    const out3 = rewriteOutputUrl(new URL('https://viewixsoft.com/blog?product=nfc'), slugMap)
    expect(out3.pathname).toBe('/tin-tuc')
    expect(out3.search).toBe('?product=nfc')
  })

  it('rewrites incoming custom filter paths back to internal route + search params', () => {
    const inp1 = rewriteInputUrl(new URL('https://viewixsoft.com/tin-tuc-cms'), slugMap)
    expect(inp1.pathname).toBe('/blog')
    expect(inp1.searchParams.get('product')).toBe('cms')

    const inp2 = rewriteInputUrl(new URL('https://viewixsoft.com/case-studies/pos?utm_medium=cpc'), slugMap)
    expect(inp2.pathname).toBe('/case-studies')
    expect(inp2.searchParams.get('product')).toBe('pos')
    expect(inp2.searchParams.get('utm_medium')).toBe('cpc')
  })

  it('301-redirects old ?product=… URLs (both default and renamed collection) to custom filter path', () => {
    expect(resolveRedirect('/blog', slugMap, {}, '?product=cms')).toBe('/tin-tuc-cms')
    expect(resolveRedirect('/tin-tuc', slugMap, {}, '?product=cms')).toBe('/tin-tuc-cms')
    expect(resolveRedirect('/blog', slugMap, {}, '?product=cms&utm_source=google')).toBe('/tin-tuc-cms?utm_source=google')
    expect(resolveRedirect('/tin-tuc-cms', slugMap, {}, '')).toBeNull()
  })

  it('includes customized filter landing pages in sitemap.xml', () => {
    const config = { ...DEFAULT_SITE_CONFIG, slugs: slugMap }
    const entries = sitemapEntries(undefined, config)
    expect(entries.some((e) => e.path === '/tin-tuc-cms')).toBe(true)
    expect(entries.some((e) => e.path === '/case-studies/pos')).toBe(true)
  })
})
