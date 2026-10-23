import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'
import { Calendar } from 'lucide-react'
import { BLOG_POSTS, BLOG_PRODUCTS } from '~/content/blog'
import { NewsletterSignup } from '~/components/blocks/NewsletterSignup'
import { PRODUCTS } from '~/content/products'
import { pageContent, siteConfigFromMatches } from '~/lib/page-content'
import { usePageContent } from '~/lib/use-page-content'
import { HeroTitle } from '~/components/ui/hero-heading'
import { generateMetaTags } from '~/lib/seo/meta'
import { getBreadcrumbSchema } from '~/lib/seo/jsonld'
import { cn } from '~/lib/cn'

const searchSchema = z.object({
  product: z.enum(BLOG_PRODUCTS).optional().catch(undefined),
})

const productName = (slug: string) => PRODUCTS.find((p) => p.slug === slug)?.name ?? slug

const POSTS = BLOG_POSTS

export const Route = createFileRoute('/blog/')({
  validateSearch: searchSchema,
  head: ({ matches }) => {
    const seo = generateMetaTags({
      ...pageContent(siteConfigFromMatches(matches), 'blog').seo,
      canonicalUrl: '/blog',
    })
    return {
      meta: seo.meta,
      links: seo.links,
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(
            getBreadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Blog', path: '/blog' },
            ]),
          ),
        },
      ],
    }
  },
  component: BlogIndexPage,
})

function FilterChip({ active, product, children }: { active: boolean; product?: (typeof BLOG_PRODUCTS)[number]; children: string }) {
  return (
    <Link
      to="/blog"
      search={product ? { product } : {}}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors',
        active
          ? 'border-transparent bg-brand-gradient text-on-gradient'
          : 'border-ink-700 bg-ink-950 text-ink-300 hover:border-signal-400 hover:text-ink-50',
      )}
    >
      {children}
    </Link>
  )
}

function BlogIndexPage() {
  const { product } = Route.useSearch()
  const posts = product ? POSTS.filter((p) => p.product === product) : POSTS
  // The header sits on the brand gradient, so the highlight stays plain white text.
  const { hero } = usePageContent('blog')

  return (
    <div className="pb-24">
      {/* The text sits in the top half, where the gradient is still solid enough for white text to pass AA. */}
      <header className="bg-[linear-gradient(180deg,var(--color-gradient-from)_0%,var(--color-gradient-via)_50%,var(--surface-room)_100%)] px-4 pt-20 pb-36 text-center sm:px-6 md:pt-28 md:pb-44">
        <div className="mx-auto max-w-3xl space-y-5">
          {hero.eyebrow && <p className="eyebrow text-on-gradient">{hero.eyebrow}</p>}
          <h1 className="text-hero font-bold tracking-tight text-on-gradient">
            <HeroTitle hero={hero} highlightClassName="" />
          </h1>
          {hero.description && (
            <p className="text-pretty text-lg leading-relaxed text-on-gradient sm:text-xl">{hero.description}</p>
          )}
        </div>
      </header>

      <div className="page-x space-y-10">
        <nav aria-label="Filter by product" className="flex flex-wrap justify-center gap-2">
          <FilterChip active={!product}>All products</FilterChip>
          {BLOG_PRODUCTS.map((slug) => (
            <FilterChip key={slug} active={product === slug} product={slug}>
              {productName(slug)}
            </FilterChip>
          ))}
        </nav>

        {posts.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-ink-700 p-10 text-center text-ink-400">
            {product
              ? `No posts about ${productName(product)} yet.`
              : 'The first guides are on the way. Subscribe below to get them by email.'}
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, idx) => (
              <li key={post.slug}>
                <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-ink-800 bg-ink-950 transition-colors hover:border-signal-500">
                  <div className="aspect-video overflow-hidden bg-ink-900">
                    <img
                      src={post.cover.src}
                      alt={post.cover.alt}
                      width={960}
                      height={540}
                      loading={idx < 3 ? 'eager' : 'lazy'}
                      decoding="async"
                      className="size-full object-cover transition-transform duration-500 ease-broadcast group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-4 p-6">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="rounded-full bg-signal-950 px-3 py-1 font-medium text-signal-400">
                        {productName(post.product)}
                      </span>
                      <span className="flex items-center gap-1.5 text-ink-400">
                        <Calendar className="size-4" aria-hidden="true" />
                        <time dateTime={post.publishedAt}>{post.publishedAt}</time>
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold leading-snug text-ink-50 transition-colors group-hover:text-signal-400">
                      {/* Stretched link: the whole card is one click target, announced once. */}
                      <Link
                        to="/blog/$slug"
                        params={{ slug: post.slug }}
                        preload="intent"
                        className="after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
                      >
                        {post.title}
                      </Link>
                    </h2>
                    <p className="line-clamp-2 text-ink-400">{post.description}</p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}

        <NewsletterSignup />
      </div>
    </div>
  )
}
