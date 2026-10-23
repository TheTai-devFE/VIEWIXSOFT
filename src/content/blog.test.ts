import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { loadPostBody, parseAllPosts } from '~/content/blog'
import { buildTitle, TITLE_MAX } from '~/lib/seo/meta'

// `pnpm build` runs this first, so a bad post stops the build.
describe('blog content', () => {
  const posts = parseAllPosts()

  it('has valid frontmatter in every post', () => {
    expect(posts.length).toBeGreaterThan(0)
  })

  it.each(posts.map((p) => [p.slug, p] as const))('%s fits the title limit and has a TOC', (_, post) => {
    expect(buildTitle(post.seoTitle).length).toBeLessThanOrEqual(TITLE_MAX)
    expect(post.toc.length).toBeGreaterThan(0)
    expect(post.readingMinutes).toBeGreaterThan(0)
  })

  it('has unique slugs and SEO titles', () => {
    expect(new Set(posts.map((p) => p.slug)).size).toBe(posts.length)
    expect(new Set(posts.map((p) => p.seoTitle)).size).toBe(posts.length)
  })

  // The list reads TOC ids from `?meta`; the page renders headings from the
  // compiled MDX. Both must agree or TOC links jump nowhere.
  it.each(posts.map((p) => [p.slug, p] as const))('%s TOC ids match the rendered headings', async (_, post) => {
    const Body = await loadPostBody(post.slug)
    expect(Body).not.toBeNull()
    if (!Body) return
    const html = renderToStaticMarkup(createElement(Body))
    for (const entry of post.toc) expect(html).toContain(`id="${entry.id}"`)
  })
})
