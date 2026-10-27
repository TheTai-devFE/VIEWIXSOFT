import { describe, expect, it } from 'vitest'
import { BLOG_POSTS } from '~/content/blog'
import { PRODUCTS } from '~/content/products'
import { USE_CASES } from '~/content/useCases'
import {
  buildLlmsFullTxt,
  bundledContent,
  buildLlmsTxt,
  buildRobotsTxt,
  buildRssXml,
  buildSitemapXml,
  productMarkdown,
  sitemapEntries,
} from '~/lib/seo/generators'
import { AI_CRAWLERS } from '~/lib/seo/site-pages'
import { SITE_URL } from '~/lib/seo/meta'

/** Split robots.txt into { agent → rules } groups. */
function robotsGroups(txt: string) {
  const groups = new Map<string, string[]>()
  for (const block of txt.trim().split(/\n\n+/)) {
    const [first, ...rest] = block.split('\n')
    if (first?.startsWith('User-agent: ')) groups.set(first.slice('User-agent: '.length), rest)
  }
  return groups
}

describe('sitemap', () => {
  const entries = sitemapEntries()

  it('lists every product, use case and post', () => {
    const paths = entries.map((e) => e.path)
    for (const p of PRODUCTS) expect(paths).toContain(`/products/${p.slug}`)
    for (const u of USE_CASES) expect(paths).toContain(`/case-studies/${u.slug}`)
    for (const b of BLOG_POSTS.filter((p) => !p.draft)) expect(paths).toContain(`/blog/${b.slug}`)
    for (const b of BLOG_POSTS.filter((p) => p.draft)) expect(paths).not.toContain(`/blog/${b.slug}`)
  })

  it('never lists noindex or redirecting pages', () => {
    const paths = entries.map((e) => e.path)
    expect(paths.some((p) => p.startsWith('/admin') || p === '/design-system' || p.startsWith('/blog/category'))).toBe(false)
  })

  it('has unique, lowercase paths without trailing slashes and valid dates', () => {
    const paths = entries.map((e) => e.path)
    expect(new Set(paths).size).toBe(paths.length)
    for (const e of entries) {
      expect(e.path).toBe(e.path.toLowerCase())
      if (e.path !== '/') expect(e.path.endsWith('/')).toBe(false)
      expect(e.lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('renders absolute URLs', () => {
    const xml = buildSitemapXml()
    expect(xml).toContain('<loc>https://viewixsoft.com/</loc>')
    expect(xml).toContain('<loc>https://viewixsoft.com/products/cms</loc>')
  })

  it('filters out hidden pages and collections from sitemap when config hides them', () => {
    const mockConfig = {
      content: {
        'global:page_visibility': {
          pricing: false,
          blog: false,
        },
      },
    } as any

    const filtered = sitemapEntries(PRODUCTS, mockConfig)
    const paths = filtered.map((e) => e.path)
    expect(paths).not.toContain('/pricing')
    expect(paths).not.toContain('/blog')
    expect(paths.some((p) => p.startsWith('/blog/'))).toBe(false)
    expect(paths).toContain('/')
    expect(paths).toContain('/about')
  })
})

describe('robots.txt', () => {
  it('keeps /admin blocked for AI crawlers too', () => {
    const groups = robotsGroups(buildRobotsTxt('allow'))
    for (const bot of ['*', ...AI_CRAWLERS]) {
      expect(groups.get(bot), bot).toContain('Disallow: /admin')
    }
  })

  it('blocks AI crawlers site-wide when the policy is block', () => {
    const groups = robotsGroups(buildRobotsTxt('block'))
    for (const bot of AI_CRAWLERS) expect(groups.get(bot)).toEqual(['Disallow: /'])
    expect(groups.get('*')).toContain('Allow: /')
  })

  it('points to the sitemap', () => {
    expect(buildRobotsTxt()).toContain('Sitemap: https://viewixsoft.com/sitemap.xml')
  })
})

describe('rss', () => {
  it('includes every post, newest first, with escaped text', () => {
    const xml = buildRssXml()
    const published = BLOG_POSTS.filter((p) => !p.draft)
    expect(xml.match(/<item>/g) ?? []).toHaveLength(published.length)
    if (published.length === 0) return
    const newest = [...published].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0]
    expect(xml.indexOf(`/blog/${newest?.slug}<`)).toBeLessThan(xml.indexOf('</item>'))
    expect(xml).not.toMatch(/<title>[^<]*&[^a#][^<]*<\/title>/)
  })
})

describe('llms.txt and Markdown twins', () => {
  it('lists the home FAQ it is given, so admin edits reach llms-full.txt', () => {
    const faq = [{ question: 'Can I edit this FAQ?', answer: 'Yes, from the admin.' }]
    const txt = buildLlmsFullTxt(PRODUCTS, bundledContent(), faq)
    expect(txt).toContain('Can I edit this FAQ?')
    expect(txt).toContain('Yes, from the admin.')
  })

  it('labels unreleased products as coming soon', () => {
    const txt = buildLlmsTxt()
    for (const p of PRODUCTS) {
      expect(txt).toContain(`[${p.name}]`)
      if (p.status === 'coming-soon') expect(txt).toMatch(new RegExp(`${p.name}\\]\\([^)]*\\) \\(coming soon\\)`))
    }
  })

  it('renders a product as Markdown with its status', () => {
    const cms = PRODUCTS.find((p) => p.slug === 'cms')
    expect(cms).toBeDefined()
    if (!cms) return
    const md = productMarkdown(cms)
    expect(md.startsWith('# Viewixsoft CMS')).toBe(true)
    expect(md).toContain('Status: available now')
  })
})

describe('admin content in the generated files', () => {
  const base = BLOG_POSTS[0]
  if (!base) throw new Error('These tests need at least one bundled post')
  const adminPost = {
    ...base,
    slug: 'written-in-admin',
    title: 'Written in the admin',
    publishedAt: '2030-01-01',
    updatedAt: '2030-01-02',
    draft: false,
  }
  const content = { posts: [{ post: adminPost, body: '## Section\n\nAdmin body text.' }], useCases: [] }

  it('lists admin posts in the sitemap, llms.txt and llms-full.txt', () => {
    expect(sitemapEntries(PRODUCTS, null, content).map((e) => e.path)).toContain('/blog/written-in-admin')
    expect(buildLlmsTxt(PRODUCTS, content)).toContain(`${SITE_URL}/blog/written-in-admin.md`)
    expect(buildLlmsFullTxt(PRODUCTS, content)).toContain('Admin body text.')
  })

  it('dates the blog index by its newest post', () => {
    const blog = sitemapEntries(PRODUCTS, null, content).find((e) => e.path === '/blog')
    expect(blog?.lastmod).toBe('2030-01-02')
  })
})
