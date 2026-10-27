import { describe, expect, it } from 'vitest'
import { checkPost, checklistScore } from '~/lib/seo/post-checklist'
import type { PostDraft } from '~/lib/seo/post-checklist'

const filler = (n: number) => Array.from({ length: n }, () => 'word').join(' ')

const good: PostDraft = {
  title: 'How to run 100 screens from one dashboard',
  seoTitle: '',
  description: 'A step-by-step guide to managing 100 digital signage screens from one cloud dashboard, with the setup, costs and mistakes to avoid.',
  slug: 'manage-100-screens',
  content: [
    'You can run 100 screens from one dashboard by grouping them by location and scheduling playlists centrally.',
    '',
    '## What do you need before you start?',
    '',
    '- A list of screens',
    '- [Viewixsoft CMS](/products/cms)',
    '',
    filler(820),
    '',
    '## How long does setup take?',
    '',
    '![Screen wall in a store](/a.webp)',
    '',
    'About 40% faster, according to [this study](https://example.com).',
  ].join('\n'),
  coverUrl: '/cover.webp',
  coverAlt: 'Screen wall',
  keyTakeaways: ['One', 'Two', 'Three'],
  faqCount: 3,
  author: { name: 'Linh Tran', role: 'Solutions Engineer', kind: 'person', hasBio: true, hasPhoto: true },
}

const statusOf = (draft: PostDraft, id: string) => checkPost(draft).find((c) => c.id === id)?.status

describe('checkPost', () => {
  it('passes every check on a well-prepared post', () => {
    const failing = checkPost(good).filter((c) => c.status !== 'pass')
    expect(failing).toEqual([])
    expect(checklistScore(checkPost(good))).toEqual({ passed: 18, total: 18, failed: 0 })
  })

  it('fails an H1 inside the body, but not a # comment in code', () => {
    expect(statusOf({ ...good, content: `# Title again\n${good.content}` }, 'no-h1')).toBe('fail')
    expect(statusOf({ ...good, content: `${good.content}\n\n\`\`\`sh\n# install\n\`\`\`` }, 'no-h1')).toBe('pass')
  })

  it('counts the search title with the " — Viewixsoft" suffix', () => {
    expect(statusOf({ ...good, title: 'x'.repeat(48) }, 'title-length')).toBe('warn')
    expect(statusOf({ ...good, title: 'x'.repeat(48), seoTitle: 'Short title' }, 'title-length')).toBe('pass')
  })

  it('warns on a meta description Google would cut', () => {
    expect(statusOf({ ...good, description: 'x'.repeat(200) }, 'description-length')).toBe('warn')
    expect(statusOf({ ...good, description: '' }, 'description-length')).toBe('fail')
  })

  it('fails images without alt text', () => {
    expect(statusOf({ ...good, content: `${good.content}\n![](/b.webp)` }, 'image-alt')).toBe('fail')
  })

  it('flags numbers without a source', () => {
    const content = good.content.replace('according to [this study](https://example.com)', '')
    expect(statusOf({ ...good, content }, 'sourced-numbers')).toBe('warn')
  })

  it('fails shortened product names', () => {
    expect(statusOf({ ...good, content: `${good.content}\nTry Viewix CMS today.` }, 'product-names')).toBe('fail')
  })

  it('allows Viewix, the hardware brand, on its own', () => {
    expect(statusOf({ ...good, content: `${good.content}\nIt runs on Viewix screens.` }, 'product-names')).toBe('pass')
  })

  it('asks for a named author instead of a team byline', () => {
    expect(statusOf({ ...good, author: { ...good.author, name: 'Viewixsoft Team' } }, 'author')).toBe('warn')
    expect(statusOf({ ...good, author: { ...good.author, kind: 'organization' } }, 'author')).toBe('warn')
  })

  it('names what an author profile is missing', () => {
    const check = checkPost({ ...good, author: { ...good.author, hasBio: false, hasPhoto: false } }).find((c) => c.id === 'author')
    expect(check?.hint).toContain('giới thiệu, ảnh')
  })

  it('asks for at least two FAQ entries', () => {
    expect(statusOf({ ...good, faqCount: 1 }, 'faq')).toBe('warn')
  })

  it('wants the answer before the first H2', () => {
    expect(statusOf({ ...good, content: good.content.replace(/^You can[^\n]*\n/, '') }, 'answer-first')).toBe('warn')
  })
})
