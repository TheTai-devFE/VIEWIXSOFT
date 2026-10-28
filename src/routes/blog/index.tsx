import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { z } from 'zod'
import { Rss } from 'lucide-react'
import { BLOG_POSTS, BLOG_PRODUCTS } from '~/content/blog'
import { NewsletterSignup } from '~/components/blocks/NewsletterSignup'
import { PRODUCTS } from '~/content/products'
import { pageContent, siteConfigFromMatches } from '~/lib/page-content'
import { generateMetaTags } from '~/lib/seo/meta'
import { ldScripts } from '~/lib/seo/custom-schema'
import { getPageSchemasFn } from '~/server/functions/custom-schemas'
import { getBreadcrumbSchema } from '~/lib/seo/jsonld'
import { cn } from '~/lib/cn'
import { getPublishedBlogPostsFn } from '~/server/functions/blog'
import { getSiteConfigFn } from '~/server/functions/site'
import { isPageVisible } from '~/lib/page-visibility'

const searchSchema = z.object({
  product: z.enum(BLOG_PRODUCTS).optional().catch(undefined),
})

const productName = (slug: string) => PRODUCTS.find((p) => p.slug === slug)?.name ?? slug

const formatDateAntigravity = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`)
  const day = d.getUTCDate()
  const month = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
  const year = d.getUTCFullYear()
  return `${day} ${month} ${year}`
}

export const Route = createFileRoute('/blog/')({
  validateSearch: searchSchema,
  loader: async () => {
    const [config, res, schemas] = await Promise.all([
      getSiteConfigFn(),
      getPublishedBlogPostsFn(),
      getPageSchemasFn({ data: { path: '/blog' } }),
    ])
    if (!isPageVisible(config, 'blog')) throw notFound()
    return { dbPosts: res.ok ? res.posts : [], schemas }
  },
  head: ({ matches, loaderData }) => {
    const seo = generateMetaTags({
      ...pageContent(siteConfigFromMatches(matches), 'blog').seo,
      canonicalUrl: '/blog',
    })
    return {
      meta: seo.meta,
      links: seo.links,
      scripts: ldScripts([
        getBreadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blog' },
        ]),
      ], loaderData?.schemas),
    }
  },
  component: BlogIndexPage,
})

function BlogIndexPage() {
  const { product } = Route.useSearch()
  const { dbPosts } = Route.useLoaderData()

  const dynamicPosts = dbPosts.map((p) => {
    const readingMinutes = Math.max(1, Math.round(p.content.split(/\s+/).length / 200))
    return {
      slug: p.slug,
      title: p.title,
      description: p.description,
      product: p.product as (typeof BLOG_PRODUCTS)[number],
      category: p.category || productName(p.product),
      readingMinutes,
      publishedAt: p.publishedAt
        ? new Date(p.publishedAt).toISOString().slice(0, 10)
        : new Date(p.createdAt).toISOString().slice(0, 10),
      cover: {
        src: p.coverUrl || '/devices/stock/retail-screens.webp',
        alt: p.coverAlt || p.title,
      },
    }
  })

  const allPosts = [
    ...dynamicPosts,
    ...BLOG_POSTS.filter((p) => !dynamicPosts.some((dp) => dp.slug === p.slug)),
  ]
  const posts = product ? allPosts.filter((p) => p.product === product) : allPosts

  const featuredPost = posts[0]
  const regularPosts = posts.slice(1)

  return (
    <div className="page-x py-8 sm:py-12 md:py-16 space-y-14">
      {/* 1. Antigravity Featured Section */}
      {featuredPost && (
        <section className="pt-2">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14">
            {/* Left text column */}
            <div className="space-y-4 sm:space-y-5">
              <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink-50 sm:text-5xl md:text-6xl">
                Featured
              </h1>
              <h2 className="font-display text-2xl font-bold tracking-tight text-ink-50 transition-colors hover:text-signal-300 sm:text-3xl md:text-4xl leading-tight">
                <Link to="/blog/$slug" params={{ slug: featuredPost.slug }}>
                  {featuredPost.title}
                </Link>
              </h2>
              <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-ink-400">
                <span>{formatDateAntigravity(featuredPost.publishedAt)}</span>
                <span className="text-ink-600">·</span>
                <span>{featuredPost.readingMinutes} min read</span>
                <span className="rounded-full border border-ink-800 bg-ink-900/60 px-2.5 py-0.5 text-xs font-medium text-ink-300">
                  {featuredPost.category || productName(featuredPost.product)}
                </span>
              </div>
              <div className="pt-2">
                <Link
                  to="/blog/$slug"
                  params={{ slug: featuredPost.slug }}
                  className="inline-flex items-center rounded-full border border-ink-800 bg-ink-950/80 px-5 py-2 text-xs sm:text-sm font-medium text-ink-100 shadow-xs transition-all hover:border-ink-700 hover:bg-ink-800/80 hover:text-white"
                >
                  Read blog
                </Link>
              </div>
            </div>

            {/* Right hero image card */}
            <Link
              to="/blog/$slug"
              params={{ slug: featuredPost.slug }}
              className="group relative aspect-video w-full overflow-hidden rounded-3xl border border-ink-800/80 bg-gradient-to-br from-ink-950 via-[#0a0d18] to-signal-950 shadow-xl transition-all hover:border-ink-700"
            >
              {featuredPost.cover.src && !featuredPost.cover.src.includes('retail-screens.webp') ? (
                <img
                  src={featuredPost.cover.src}
                  alt={featuredPost.cover.alt || featuredPost.title}
                  className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  loading="eager"
                />
              ) : (
                <div className="relative flex size-full flex-col items-center justify-center p-6 text-center sm:p-10">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.2)_0%,transparent_70%)]" />
                  <span className="relative z-10 mb-3 inline-flex items-center rounded-full border border-signal-800/80 bg-signal-950/80 px-3 py-1 font-mono text-[11px] font-medium text-signal-300">
                    {featuredPost.category || productName(featuredPost.product)}
                  </span>
                  <h3 className="relative z-10 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl max-w-md">
                    {featuredPost.title}
                  </h3>
                </div>
              )}
            </Link>
          </div>
        </section>
      )}

      {/* 2. Antigravity Category Tabs & RSS Feed Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-800/60 pb-3 pt-4">
        <nav aria-label="Filter by category" className="flex flex-wrap items-center gap-6 sm:gap-8 text-sm">
          <Link
            to="/blog"
            search={{}}
            className={cn(
              'relative py-1 font-medium transition-colors',
              !product
                ? 'text-ink-50 font-semibold after:absolute after:bottom-[-13px] after:inset-x-0 after:h-0.5 after:bg-ink-50'
                : 'text-ink-400 hover:text-ink-100',
            )}
          >
            All
          </Link>
          {BLOG_PRODUCTS.map((slug) => {
            const isActive = product === slug
            return (
              <Link
                key={slug}
                to="/blog"
                search={{ product: slug }}
                className={cn(
                  'relative py-1 font-medium transition-colors',
                  isActive
                    ? 'text-ink-50 font-semibold after:absolute after:bottom-[-13px] after:inset-x-0 after:h-0.5 after:bg-ink-50'
                    : 'text-ink-400 hover:text-ink-100',
                )}
              >
                {productName(slug)}
              </Link>
            )
          })}
        </nav>

        {/* RSS Feed button */}
        <a
          href="/rss.xml"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-ink-800/80 bg-ink-950/60 px-3.5 py-1 text-xs font-medium text-ink-300 transition-all hover:border-ink-700 hover:text-ink-50"
        >
          <Rss className="size-3 text-ink-400" />
          <span>RSS Feed</span>
        </a>
      </div>

      {/* 3. Antigravity 2-Column Horizontal Cards Grid */}
      {posts.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-ink-700 p-12 text-center text-ink-400 text-sm">
          {product
            ? `No articles found for ${productName(product)} yet.`
            : 'The first guides are on the way. Subscribe below to get them by email.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-2 lg:gap-x-16 lg:gap-y-14">
          {regularPosts.map((post) => (
            <article key={post.slug} className="group flex items-start justify-between gap-6">
              {/* Left text column */}
              <div className="min-w-0 flex-1 space-y-2.5">
                <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-ink-50 transition-colors group-hover:text-signal-300 leading-snug">
                  <Link to="/blog/$slug" params={{ slug: post.slug }}>
                    {post.title}
                  </Link>
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-ink-400">
                  <span>{formatDateAntigravity(post.publishedAt)}</span>
                  <span className="text-ink-600">·</span>
                  <span>{post.readingMinutes} min read</span>
                  <span className="rounded-full border border-ink-800/80 bg-ink-900/60 px-2 py-0.5 text-[11px] font-medium text-ink-300">
                    {post.category || productName(post.product)}
                  </span>
                </div>
                <div className="pt-2">
                  <Link
                    to="/blog/$slug"
                    params={{ slug: post.slug }}
                    className="inline-flex items-center rounded-full border border-ink-800/80 bg-ink-950/60 px-3.5 py-1 text-xs font-medium text-ink-200 transition-all hover:border-ink-700 hover:bg-ink-800/80 hover:text-white"
                  >
                    Read blog
                  </Link>
                </div>
              </div>

              {/* Right square thumbnail */}
              <Link
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="size-28 sm:size-36 lg:size-40 shrink-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-ink-800/80 bg-gradient-to-br from-ink-950 to-signal-950/40 shadow-sm transition-transform duration-300 group-hover:scale-105"
              >
                {post.cover.src && !post.cover.src.includes('retail-screens.webp') ? (
                  <img
                    src={post.cover.src}
                    alt={post.cover.alt || post.title}
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex size-full flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-ink-950 via-[#0a0d18] to-signal-950">
                    <span className="font-display text-[10px] sm:text-xs font-bold text-white line-clamp-2">
                      {post.title}
                    </span>
                  </div>
                )}
              </Link>
            </article>
          ))}
        </div>
      )}

      {/* 4. Bottom Newsletter */}
      <div className="pt-10 border-t border-ink-800/60">
        <NewsletterSignup />
      </div>
    </div>
  )
}
