import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BlogPostRow, UseCaseRow } from '~/server/db/schema'
import { DEFAULT_SITE_CONFIG } from '~/lib/site-config'
import type { SiteConfig } from '~/lib/site-config'

const listPosts = vi.fn<() => Promise<BlogPostRow[]>>()
const listUseCases = vi.fn<() => Promise<UseCaseRow[]>>()

vi.mock('~/server/db/client', () => ({ hasDatabase: () => true }))
vi.mock('~/server/logger', () => ({ logger: { error: vi.fn() }, errorFields: () => ({}) }))
vi.mock('~/server/blog/repository', () => ({ listPublishedBlogPosts: () => listPosts() }))
vi.mock('~/server/use-cases/repository', () => ({ listPublishedUseCases: () => listUseCases() }))
vi.mock('~/server/content/blog-raw', () => ({ postMarkdown: () => 'MDX body' }))
vi.mock('~/server/authors/repository', () => ({ listAuthors: async () => [] }))

const { loadPublishedContent } = await import('~/server/content/published')
const { BLOG_POSTS } = await import('~/content/blog')
const { USE_CASES } = await import('~/content/useCases')

const postRow = (overrides: Partial<BlogPostRow> = {}): BlogPostRow => ({
  id: '00000000-0000-4000-8000-000000000001',
  slug: 'written-in-admin',
  title: 'A post written in the admin panel',
  seoTitle: null,
  description: 'Written in /admin/blog and stored in the database.',
  content: '## Heading\n\nAdmin body.',
  coverUrl: 'https://media.example.com/cover.webp',
  coverAlt: 'Cover',
  category: 'Guide',
  product: 'cms',
  tags: ['guide'],
  authorName: 'Linh Tran',
  authorId: null,
  authorRole: 'Solutions Engineer',
  keyTakeaways: ['One takeaway'],
  seoDescription: null,
  faq: [],
  createdBy: null,
  updatedBy: null,
  status: 'published',
  publishedAt: new Date('2026-10-20T00:00:00Z'),
  createdAt: new Date('2026-10-19T00:00:00Z'),
  updatedAt: new Date('2026-10-21T00:00:00Z'),
  ...overrides,
})

const hidden = (key: string): SiteConfig => ({ ...DEFAULT_SITE_CONFIG, content: { 'global:page_visibility': { [key]: false } } })

describe('loadPublishedContent', () => {
  beforeEach(() => {
    listPosts.mockResolvedValue([postRow()])
    listUseCases.mockResolvedValue([])
  })

  it('publishes admin posts next to the MDX files, newest first', async () => {
    const { posts } = await loadPublishedContent(DEFAULT_SITE_CONFIG)
    expect(posts.map((p) => p.post.slug)).toContain('written-in-admin')
    expect(posts.find((p) => p.post.slug === 'written-in-admin')?.body).toBe('## Heading\n\nAdmin body.')
    expect(posts).toHaveLength(BLOG_POSTS.filter((p) => !p.draft).length + 1)
    const dates = posts.map((p) => p.post.publishedAt)
    expect([...dates].sort().reverse()).toEqual(dates)
  })

  it('lets an admin post replace the MDX file with the same slug', async () => {
    const file = BLOG_POSTS.find((p) => !p.draft)
    if (!file) return
    listPosts.mockResolvedValue([postRow({ slug: file.slug, title: 'Edited in the admin' })])
    const { posts } = await loadPublishedContent(DEFAULT_SITE_CONFIG)
    const matches = posts.filter((p) => p.post.slug === file.slug)
    expect(matches).toHaveLength(1)
    expect(matches[0]?.post.title).toBe('Edited in the admin')
  })

  it('leaves out the blog and hidden case studies', async () => {
    expect((await loadPublishedContent(hidden('blog'))).posts).toEqual([])
    const first = USE_CASES[0]
    if (!first) return
    const { useCases } = await loadPublishedContent(hidden(`use-case-${first.slug}`))
    expect(useCases.map((u) => u.slug)).not.toContain(first.slug)
  })

  it('still publishes the bundled files when the database fails', async () => {
    listPosts.mockRejectedValue(new Error('down'))
    listUseCases.mockRejectedValue(new Error('down'))
    const content = await loadPublishedContent(DEFAULT_SITE_CONFIG)
    expect(content.posts.length).toBe(BLOG_POSTS.filter((p) => !p.draft).length)
    expect(content.useCases.length).toBe(USE_CASES.length)
  })
})
