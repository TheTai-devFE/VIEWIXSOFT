import { describe, expect, it } from 'vitest'
import { BLOG_POSTS } from '~/content/blog-posts'
import { PRODUCTS } from '~/content/products'
import { USE_CASES } from '~/content/useCases'
import { blogPostSeo, productSeo, useCaseSeo } from '~/lib/seo/page-seo'
import { buildTitle, DESCRIPTION_MAX, generateMetaTags, TITLE_MAX } from '~/lib/seo/meta'

describe('generateMetaTags', () => {
  it('appends the brand with an em dash', () => {
    const { meta } = generateMetaTags({ title: 'Pricing', description: 'x', canonicalUrl: '/pricing' })
    expect(meta[0]).toEqual({ title: 'Pricing — Viewixsoft' })
  })

  it('does not repeat the brand', () => {
    expect(buildTitle('Viewixsoft CMS pricing')).toBe('Viewixsoft CMS pricing')
  })

  it('builds an absolute canonical without a query string or trailing slash', () => {
    const { links } = generateMetaTags({ title: 'A', description: 'x', canonicalUrl: '/products/cms' })
    expect(links[0]).toEqual({ rel: 'canonical', href: 'https://viewixsoft.com/products/cms' })
    const home = generateMetaTags({ title: 'A', description: 'x', canonicalUrl: '/' })
    expect(home.links[0]?.href).toBe('https://viewixsoft.com/')
  })

  it('emits en and x-default hreflang', () => {
    const { links } = generateMetaTags({ title: 'A', description: 'x', canonicalUrl: '/about' })
    expect(links.filter((l) => l.hrefLang).map((l) => l.hrefLang)).toEqual(['en', 'x-default'])
  })

  it('advertises the Markdown twin when given', () => {
    const { links } = generateMetaTags({ title: 'A', description: 'x', markdownPath: '/products/cms.md' })
    expect(links).toContainEqual({ rel: 'alternate', type: 'text/markdown', href: 'https://viewixsoft.com/products/cms.md' })
  })

  it('marks noindex pages', () => {
    const { meta } = generateMetaTags({ title: 'A', description: 'x', noindex: true })
    expect(meta).toContainEqual({ name: 'robots', content: 'noindex, nofollow' })
  })
})

describe('content SEO limits', () => {
  const pages = [
    ...PRODUCTS.map((p) => ({ id: `product:${p.slug}`, ...productSeo(p) })),
    ...USE_CASES.map((u) => ({ id: `use-case:${u.slug}`, ...useCaseSeo(u) })),
    ...BLOG_POSTS.map((b) => ({ id: `blog:${b.slug}`, ...blogPostSeo(b) })),
  ]

  it.each(pages)('$id title fits in $TITLE_MAX characters', ({ title }) => {
    expect(buildTitle(title).length).toBeLessThanOrEqual(TITLE_MAX)
  })

  it.each(pages)('$id description fits in the limit', ({ description }) => {
    expect(description.length).toBeGreaterThan(0)
    expect(description.length).toBeLessThanOrEqual(DESCRIPTION_MAX)
  })

  it('every title is unique', () => {
    const titles = pages.map((p) => buildTitle(p.title))
    expect(new Set(titles).size).toBe(titles.length)
  })
})
