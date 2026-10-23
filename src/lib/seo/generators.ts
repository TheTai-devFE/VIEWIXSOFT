import { BLOG_POSTS } from '~/content/blog'
import type { BlogPost } from '~/content/blog'

// Drafts are visible in the dev server but never published to crawlers.
const PUBLISHED_POSTS = BLOG_POSTS.filter((p) => !p.draft)
import { PRODUCTS, PRODUCT_ONE_LINERS } from '~/content/products'
import type { Product } from '~/content/products'
import { USE_CASES } from '~/content/useCases'
import type { UseCase } from '~/content/useCases'
import { HOME_FAQ } from '~/data/home-faq'
import { pricingFaq } from '~/lib/pricing'
import type { PricingPlans } from '~/lib/pricing'
import { SECTION_CONTENT } from '~/lib/section-content'
import { absoluteUrl, SITE_NAME, SITE_URL } from '~/lib/seo/meta'
import { AI_CRAWLER_POLICY, AI_CRAWLERS, DISALLOWED_PATHS, STATIC_PAGES } from '~/lib/seo/site-pages'

/*
 * Pure builders for sitemap.xml, robots.txt, rss.xml, llms.txt, llms-full.txt
 * and the per-page Markdown twins. Every file is generated from the content
 * source, so never hand-edit the output (AGENTS.md §9).
 */

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const latest = (dates: string[]) => dates.reduce((a, b) => (b > a ? b : a), '')

export interface SitemapEntry {
  path: string
  lastmod: string
}

/** Products as published: pass `visibleProducts(config)` so hidden ones drop out. */
export function sitemapEntries(products: Product[] = PRODUCTS): SitemapEntry[] {
  const useCasesLastmod = latest(USE_CASES.map((u) => u.updatedAt))
  const blogLastmod = latest(PUBLISHED_POSTS.map((b) => b.updatedAt))
  // Index pages change whenever an item in their collection does.
  const collectionLastmod: Record<string, string> = {
    '/use-cases': useCasesLastmod,
    '/blog': blogLastmod,
  }

  return [
    ...STATIC_PAGES.map((p) => ({
      path: p.path,
      lastmod: latest([p.updatedAt, collectionLastmod[p.path] ?? '']),
    })),
    ...products.map((p) => ({ path: `/products/${p.slug}`, lastmod: p.updatedAt })),
    ...USE_CASES.map((u) => ({ path: `/use-cases/${u.slug}`, lastmod: u.updatedAt })),
    ...PUBLISHED_POSTS.map((b) => ({ path: `/blog/${b.slug}`, lastmod: b.updatedAt })),
  ]
}

export function buildSitemapXml(entries: SitemapEntry[] = sitemapEntries()) {
  const urls = entries
    .map((e) => `  <url>\n    <loc>${escapeXml(absoluteUrl(e.path))}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n  </url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export function buildRobotsTxt(policy: 'allow' | 'block' = AI_CRAWLER_POLICY) {
  const disallow = DISALLOWED_PATHS.map((p) => `Disallow: ${p}`)
  // A crawler obeys only the most specific group that names it, so every
  // AI group repeats the site-wide Disallow lines.
  const aiRules = policy === 'allow' ? ['Allow: /', ...disallow] : ['Disallow: /']
  const groups = [
    ['User-agent: *', 'Allow: /', ...disallow],
    ...AI_CRAWLERS.map((bot) => [`User-agent: ${bot}`, ...aiRules]),
  ]
  return `${groups.map((g) => g.join('\n')).join('\n\n')}\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
}

function rfc822(date: string) {
  return new Date(`${date}T00:00:00Z`).toUTCString()
}

export function buildRssXml(posts: BlogPost[] = PUBLISHED_POSTS) {
  const sorted = [...posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  const items = sorted
    .map((p) => {
      const url = `${SITE_URL}/blog/${p.slug}`
      return [
        '    <item>',
        `      <title>${escapeXml(p.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${rfc822(p.publishedAt)}</pubDate>`,
        `      <category>${escapeXml(p.category)}</category>`,
        `      <description>${escapeXml(p.description)}</description>`,
        '    </item>',
      ].join('\n')
    })
    .join('\n')
  const lastBuild = sorted[0] ? rfc822(latest(sorted.map((p) => p.updatedAt))) : new Date(0).toUTCString()
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME} Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Guides on digital signage software, menu boards, proof-of-play and NFC from the ${SITE_NAME} team.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`
}

function summary(products: Product[]) {
  const names = (status: Product['status']) => products.filter((p) => p.status === status).map((p) => p.name)
  const available = names('available')
  const upcoming = names('coming-soon')
  return [
    'Viewixsoft is digital signage software for advertising screens, kiosks and menu boards. It is the software arm of Viewix, which builds the screens.',
    available.length ? `Available now: ${available.join(', ')}.` : '',
    upcoming.length ? `Coming soon: ${upcoming.join(', ')}.` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function statusLabel(p: Product) {
  return p.status === 'available' ? 'available now' : 'coming soon'
}

export function buildLlmsTxt(published: Product[] = PRODUCTS) {
  const products = published.map(
    (p) => `- [${p.name}](${SITE_URL}/products/${p.slug}.md) (${statusLabel(p)}): ${PRODUCT_ONE_LINERS[p.slug] ?? p.tagline}`,
  )
  const useCases = USE_CASES.map((u) => `- [${u.title}](${SITE_URL}/use-cases/${u.slug}.md): ${u.tagline}`)
  const posts = PUBLISHED_POSTS.map((b) => `- [${b.title}](${SITE_URL}/blog/${b.slug}.md): ${b.description}`)
  return [
    `# ${SITE_NAME}`,
    '',
    `> ${summary(published)}`,
    '',
    '## Products',
    '',
    ...products,
    '',
    '## Use cases',
    '',
    ...useCases,
    '',
    '## Blog',
    '',
    ...posts,
    '',
    '## Key pages',
    '',
    `- [Pricing](${SITE_URL}/pricing): Viewixsoft CMS prices per screen licence.`,
    `- [About](${SITE_URL}/about): Who builds Viewixsoft and how it relates to Viewix.`,
    `- [Contact](${SITE_URL}/contact): Book a demo or ask for a quote.`,
    '',
    '## Optional',
    '',
    `- [Full text](${SITE_URL}/llms-full.txt): Every product, use case and post in one file.`,
    '',
  ].join('\n')
}

function faqMarkdown(items: { question: string; answer: string }[]) {
  return items.flatMap((f) => [`### ${f.question}`, '', f.answer, ''])
}

export function productMarkdown(p: Product) {
  const lines = [
    `# ${p.name}`,
    '',
    `> ${p.tagline}`,
    '',
    `Status: ${statusLabel(p)}. Last updated: ${p.updatedAt}. Source: ${SITE_URL}/products/${p.slug}`,
    '',
    '## What is it?',
    '',
    p.description,
    '',
    '## Key features',
    '',
    ...p.features.map((f) => `- **${f.title}:** ${f.description}`),
    '',
    '## Specifications',
    '',
  ]
  for (const group of p.specs) {
    lines.push(`### ${group.category}`, '')
    if (group.note) lines.push(group.note, '')
    lines.push(...group.items.map((i) => `- ${i.label}: ${i.value}`), '')
  }
  if (p.relatedUseCases.length) {
    lines.push('## Use cases', '', ...p.relatedUseCases.map((u) => `- [${u.title}](${SITE_URL}/use-cases/${u.slug})`), '')
  }
  if (p.faq.length) lines.push('## FAQ', '', ...faqMarkdown(p.faq))
  return lines.join('\n')
}

export function useCaseMarkdown(u: UseCase) {
  return [
    `# ${u.title}`,
    '',
    `> ${u.tagline}`,
    '',
    `Industry: ${u.industry}. Last updated: ${u.updatedAt}. Source: ${SITE_URL}/use-cases/${u.slug}`,
    '',
    `## ${u.challengeHeading}`,
    '',
    u.challenge,
    '',
    `## ${u.solutionHeading}`,
    '',
    u.solution,
    '',
    '## Products used',
    '',
    ...u.featuredProducts.map((p) => `- [${p.name}](${SITE_URL}/products/${p.slug})`),
    '',
  ].join('\n')
}

/** `body` is the post's Markdown without frontmatter (see ~/server/content/blog-raw). */
export function blogPostMarkdown(b: BlogPost, body: string) {
  return [
    `# ${b.title}`,
    '',
    `> ${b.description}`,
    '',
    `By ${b.author.name}, ${b.author.role}. Published ${b.publishedAt}, updated ${b.updatedAt}. Source: ${SITE_URL}/blog/${b.slug}`,
    '',
    '## Key takeaways',
    '',
    ...b.keyTakeaways.map((t) => `- ${t}`),
    '',
    body,
    '',
    ...(b.faq?.length ? ['## FAQ', '', ...faqMarkdown(b.faq)] : []),
  ].join('\n')
}

export function buildLlmsFullTxt(
  published: Product[] = PRODUCTS,
  postBody: (slug: string) => string | null = () => null,
  homeFaq: { question: string; answer: string }[] = HOME_FAQ,
  prices: PricingPlans = SECTION_CONTENT['product-cms:pricing-plans'].defaults,
) {
  return [
    `# ${SITE_NAME}`,
    '',
    `> ${summary(published)}`,
    '',
    '## Frequently asked questions',
    '',
    ...faqMarkdown(homeFaq),
    '## Pricing',
    '',
    ...faqMarkdown(pricingFaq(prices)),
    ...published.map((p) => productMarkdown(p).replace(/^# /, '## ').replace(/\n## /g, '\n### ')),
    ...USE_CASES.map((u) => useCaseMarkdown(u).replace(/^# /, '## ').replace(/\n## /g, '\n### ')),
    ...PUBLISHED_POSTS.map((b) => blogPostMarkdown(b, postBody(b.slug) ?? '').replace(/^# /, '## ')),
  ].join('\n')
}

export function textResponse(body: string, contentType: string) {
  return new Response(body, {
    headers: {
      'Content-Type': `${contentType}; charset=utf-8`,
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
