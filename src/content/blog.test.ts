import { describe, expect, it } from 'vitest'
import { parseAllPosts } from '~/content/blog'
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
})
