/**
 * Indexable pages that are not generated from a content collection. Bump
 * `updatedAt` when a page's content changes; it becomes the sitemap `lastmod`.
 * Noindex pages (/admin/**, /design-system) never go here.
 */
export interface StaticPage {
  path: string
  title: string
  updatedAt: string
}

export const STATIC_PAGES: StaticPage[] = [
  { path: '/', title: 'Home', updatedAt: '2026-10-22' },
  { path: '/case-studies', title: 'Case studies', updatedAt: '2026-10-26' },
  { path: '/pricing', title: 'Pricing', updatedAt: '2026-10-22' },
  { path: '/blog', title: 'Blog', updatedAt: '2026-10-22' },
  { path: '/about', title: 'About', updatedAt: '2026-10-23' },
  { path: '/contact', title: 'Contact', updatedAt: '2026-10-22' },
  { path: '/legal/privacy', title: 'Privacy Policy', updatedAt: '2026-10-15' },
  { path: '/legal/terms', title: 'Terms of Service', updatedAt: '2026-10-15' },
  { path: '/legal/cookies', title: 'Cookie Policy', updatedAt: '2026-10-15' },
]

/**
 * AI crawler policy for robots.txt. `allow` lets the listed answer-engine and
 * training crawlers read public pages; `block` disallows them site-wide.
 * Changing this is a policy decision (AGENTS.md §14): ask before flipping it.
 */
export const AI_CRAWLER_POLICY: 'allow' | 'block' = 'allow'

export const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
] as const

/** Paths no crawler should fetch. */
export const DISALLOWED_PATHS = ['/admin'] as const
