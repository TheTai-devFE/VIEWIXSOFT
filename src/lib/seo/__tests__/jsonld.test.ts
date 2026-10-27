import { describe, expect, it } from 'vitest'
import { getArticleSchema } from '~/lib/seo/jsonld'
import { assetUrl, SITE_URL } from '~/lib/seo/meta'

const article = {
  title: 'Post',
  description: 'About it.',
  path: '/blog/post',
  publishedAt: '2026-10-01',
  updatedAt: '2026-10-02',
  authorName: 'Viewixsoft Team',
}

describe('image URLs in structured data', () => {
  it('prefixes a site path with the site URL', () => {
    expect(getArticleSchema({ ...article, image: '/devices/stock/retail-screens.webp' }).image).toBe(
      `${SITE_URL}/devices/stock/retail-screens.webp`,
    )
  })

  it('keeps a media library URL as it is', () => {
    const r2 = 'https://media.viewixsoft.com/uploads/cover.webp'
    expect(getArticleSchema({ ...article, image: r2 }).image).toBe(r2)
  })

  it('assetUrl does the same for meta tags', () => {
    expect(assetUrl('/a.webp')).toBe(`${SITE_URL}/a.webp`)
    expect(assetUrl('https://cdn.example.com/a.webp')).toBe('https://cdn.example.com/a.webp')
  })
})

describe('author in structured data', () => {
  const article = {
    title: 'Post',
    description: 'About it.',
    path: '/blog/post',
    publishedAt: '2026-10-01',
    updatedAt: '2026-10-02',
  }

  it('publishes a person with role, photo and profile link', () => {
    const { author } = getArticleSchema({
      ...article,
      authorName: 'Linh Tran',
      authorType: 'Person',
      authorJobTitle: 'Solutions Engineer',
      authorImage: '/authors/linh.webp',
      authorUrl: 'https://www.linkedin.com/in/linh',
    })
    expect(author).toMatchObject({
      '@type': 'Person',
      jobTitle: 'Solutions Engineer',
      image: `${SITE_URL}/authors/linh.webp`,
      sameAs: ['https://www.linkedin.com/in/linh'],
    })
  })

  it('publishes a team byline as the organization, without person fields', () => {
    const { author } = getArticleSchema({ ...article, authorName: 'Viewixsoft Team', authorType: 'Organization', authorJobTitle: 'x' })
    expect(author).toEqual({ '@type': 'Organization', name: 'Viewixsoft Team', url: SITE_URL })
  })
})
