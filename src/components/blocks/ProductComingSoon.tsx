import { Link } from '@tanstack/react-router'
import { PartnerBand } from '~/components/blocks/PartnerBand'
import { SubscribeForm } from '~/components/blocks/SubscribeForm'
import { Reveal } from '~/components/ui/reveal'
import { PRODUCT_ONE_LINERS } from '~/content/products'
import { useProducts } from '~/lib/use-site-config'
import type { Product } from '~/content/products'
import { NEWSLETTER_TOPICS } from '~/server/schema/validation'
import { HeroTitle } from '~/components/ui/hero-heading'
import type { PageHero } from '~/data/page-content'

/** Shown on /products/$slug while a product's status is coming-soon. */
export function ProductComingSoon({ product, hero }: { product: Product; hero: PageHero }) {
  const others = useProducts().filter((p) => p.slug !== product.slug)

  return (
    <div className="page-x py-12 md:py-20">
      {/* No visible breadcrumb trail; BreadcrumbList JSON-LD stays in head(). */}
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-signal-800 bg-signal-950 px-3 py-1 text-xs font-semibold text-signal-300">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-signal-400 motion-safe:animate-led" />
            Coming soon
          </span>
          <h1 className="mt-5 font-display text-5xl font-semibold tracking-tight text-balance text-ink-50 sm:text-6xl">
            <HeroTitle hero={hero} />
          </h1>
          {hero.description && <p className="mt-5 text-xl text-pretty text-ink-200">{hero.description}</p>}
          <p className="mt-4 max-w-xl text-pretty text-ink-400">
            {product.name} is in development. It will connect to Viewixsoft CMS, so the screens you set up today will
            be ready for it on launch day.
          </p>

          {/* Launch news for this product is picked already; visitors can add others. */}
          <SubscribeForm
            defaultTopics={NEWSLETTER_TOPICS.filter((t) => t === product.slug)}
            submitLabel="Notify me"
            align="start"
            className="mt-8"
          />

          <p className="mt-8 text-sm text-ink-400">
            Need your screens running now?{' '}
            <Link
              to="/products/$slug"
              params={{ slug: 'cms' }}
              preload="intent"
              className="font-semibold text-signal-400 hover:text-signal-300"
            >
              Start with Viewixsoft CMS
            </Link>
          </p>
        </Reveal>

        <Reveal variant="scale" delay={120}>
          <LaunchScreen name={product.name} />
        </Reveal>
      </div>

      <section aria-labelledby="other-products-title" className="mt-24 border-t border-ink-800 pt-12">
        <h2 id="other-products-title" className="font-display text-2xl font-semibold text-ink-50">
          Other Viewixsoft products
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {others.map((p) => (
            <li key={p.slug}>
              <Link
                to="/products/$slug"
                params={{ slug: p.slug }}
                preload="intent"
                className="group flex h-full flex-col rounded-2xl border border-ink-800 p-5 transition-colors hover:border-ink-600"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-display font-semibold text-ink-50 group-hover:text-signal-400">{p.name}</span>
                  <span className="rounded-full bg-ink-900 px-2 py-0.5 font-mono text-[10px] tracking-widest text-ink-400 uppercase">
                    {p.status === 'available' ? 'Available' : 'Soon'}
                  </span>
                </span>
                <span className="mt-2 text-sm text-ink-400">{PRODUCT_ONE_LINERS[p.slug]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-24">
        <PartnerBand />
      </div>
    </div>
  )
}

/** A screen "booting up" the product: decorative, so hidden from assistive tech. */
function LaunchScreen({ name }: { name: string }) {
  return (
    <div aria-hidden="true" className="mx-auto max-w-lg">
      <div className="rounded-3xl border border-ink-700 p-3 shadow-lg" style={{ background: 'var(--surface-bezel)' }}>
        <div className="bg-brand-gradient relative flex aspect-video flex-col justify-between overflow-hidden rounded-2xl p-6 text-on-gradient sm:p-8">
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase opacity-80">Launching soon</span>
          <div>
            <p className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{name}</p>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-on-gradient/25">
              <div className="h-full w-2/5 rounded-full bg-on-gradient motion-safe:animate-progress" />
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto h-10 w-3 border-x border-ink-700 bg-ink-900" />
      <div className="mx-auto h-2.5 w-36 rounded-full border border-ink-700 bg-ink-900" />
    </div>
  )
}
