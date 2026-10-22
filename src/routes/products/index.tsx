import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Bell, Check } from 'lucide-react'
import { PRODUCT_ONE_LINERS } from '~/content/products'
import { useProducts } from '~/lib/use-site-config'
import { usePageContent } from '~/lib/use-page-content'
import { HeroTitle } from '~/components/ui/hero-heading'
import type { Product } from '~/content/products'
import { Breadcrumbs } from '~/components/layout/Breadcrumbs'
import { CtaBand } from '~/components/blocks/CtaBand'
import { TERM_PLANS, formatUsd } from '~/data/pricing'
import { pageContent, siteConfigFromMatches } from '~/lib/page-content'
import { generateMetaTags } from '~/lib/seo/meta'
import { getBreadcrumbSchema } from '~/lib/seo/jsonld'

const BREADCRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Products', path: '/products' },
]

export const Route = createFileRoute('/products/')({
  head: ({ matches }) => {
    const seo = generateMetaTags({
      ...pageContent(siteConfigFromMatches(matches), 'products').seo,
      canonicalUrl: '/products',
    })
    return {
      meta: seo.meta,
      links: seo.links,
      scripts: [{ type: 'application/ld+json', children: JSON.stringify(getBreadcrumbSchema(BREADCRUMBS)) }],
    }
  },
  component: ProductsIndexPage,
})

function ProductsIndexPage() {
  const products = useProducts()
  const { hero } = usePageContent('products')
  const available = products.filter((p) => p.status === 'available')
  const upcoming = products.filter((p) => p.status === 'coming-soon')

  return (
    <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 md:py-20 lg:px-8">
      <div className="space-y-8">
        <Breadcrumbs items={BREADCRUMBS} />
        <header className="max-w-3xl">
          {hero.eyebrow && <p className="eyebrow">{hero.eyebrow}</p>}
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance text-ink-50 sm:text-5xl">
            <HeroTitle hero={hero} />
          </h1>
          {hero.description && <p className="mt-5 text-lg text-pretty text-ink-400">{hero.description}</p>}
        </header>
      </div>

      {available.map((p) => (
        <AvailableProduct key={p.slug} product={p} />
      ))}

      <section aria-labelledby="upcoming-title" className="space-y-6">
        <div className="max-w-3xl">
          <h2 id="upcoming-title" className="font-display text-2xl font-semibold tracking-tight text-ink-50 sm:text-3xl">
            What is coming next?
          </h2>
          <p className="mt-3 text-ink-400">
            These products are in development. Each one connects to Viewixsoft CMS, so screens you set up today are
            ready for them.
          </p>
        </div>
        <ul className="grid gap-5 md:grid-cols-3">
          {upcoming.map((p) => (
            <li key={p.slug}>
              <article className="flex h-full flex-col rounded-2xl border border-dashed border-ink-700 bg-ink-950 p-6">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3 className="font-display text-lg font-semibold text-ink-50">{p.name}</h3>
                  <span className="rounded-full bg-ink-850 px-2.5 py-0.5 font-mono text-[10px] tracking-[0.12em] text-ink-400 uppercase">
                    Coming soon
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink-400">{PRODUCT_ONE_LINERS[p.slug]}</p>
                {p.pairedProducts[0] && (
                  <p className="mt-3 text-sm text-ink-400">
                    Works with <span className="text-ink-200">{p.pairedProducts[0].name}</span>.
                  </p>
                )}
                <Link
                  to="/products/$slug"
                  params={{ slug: p.slug }}
                  preload="intent"
                  className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-signal-400 hover:text-signal-300"
                >
                  <Bell aria-hidden="true" className="size-3.5" />
                  Get notified about {p.name}
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </section>

      <CtaBand />
    </div>
  )
}

function AvailableProduct({ product }: { product: Product }) {
  const price = TERM_PLANS[0]
  return (
    <section
      aria-labelledby={`product-${product.slug}-title`}
      className="grid gap-10 rounded-3xl border border-ink-800 bg-ink-900 p-8 sm:p-12 lg:grid-cols-12"
    >
      <div className="lg:col-span-7">
        <span className="inline-flex items-center gap-2 rounded-full border border-signal-800 bg-signal-950 px-3 py-1 text-xs font-semibold text-signal-300">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-signal-400" />
          Available now
        </span>
        <h2
          id={`product-${product.slug}-title`}
          className="mt-5 font-display text-3xl font-semibold tracking-tight text-ink-50 sm:text-4xl"
        >
          {product.name}
        </h2>
        <p className="mt-4 text-lg text-pretty text-ink-300">{product.shortDescription}</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {product.features.map((f) => (
            <li key={f.title} className="flex items-start gap-2.5 text-sm text-ink-300">
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-signal-400" />
              <span>
                <strong className="font-semibold text-ink-50">{f.title}.</strong> {f.description}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col justify-between gap-8 rounded-2xl border border-ink-800 bg-ink-950 p-6 lg:col-span-5">
        <dl className="space-y-5 text-sm">
          <div>
            <dt className="text-ink-500">Runs on</dt>
            <dd className="mt-1 text-ink-50">{product.supportedOS.join(', ')}</dd>
          </div>
          {price && (
            <div>
              <dt className="text-ink-500">Price</dt>
              <dd className="mt-1 text-ink-50">{formatUsd(price.price)} per screen licence per year</dd>
            </div>
          )}
          <div>
            <dt className="text-ink-500">Built for</dt>
            <dd className="mt-1 text-ink-50">{product.relatedUseCases.map((u) => u.title).join(', ')}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/products/$slug"
            params={{ slug: product.slug }}
            preload="intent"
            className="bg-brand-gradient shine inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-on-gradient hover:opacity-90"
          >
            Explore {product.name}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <Link
            to="/pricing"
            preload="intent"
            className="inline-flex items-center rounded-lg border border-ink-700 px-5 py-2.5 text-sm font-semibold text-ink-50 hover:border-ink-500"
          >
            See pricing
          </Link>
        </div>
      </div>
    </section>
  )
}
