import { Link } from '@tanstack/react-router'
import { ArrowRight, Bell, Check } from 'lucide-react'
import { PRODUCT_ONE_LINERS } from '~/content/products'
import { useProducts } from '~/lib/use-site-config'
import type { Product } from '~/content/products'
import { Reveal } from '~/components/ui/reveal'


const CMS_FEATURES = [
  'Upload media and build playlists',
  'Multi-zone layouts',
  'Schedule by time and location',
  'Manage every screen remotely',
]

export function ProductLineupSection() {
  const products = useProducts()
  const available = products.filter((p) => p.status === 'available')
  const upcoming = products.filter((p) => p.status === 'coming-soon')

  return (
    <section aria-labelledby="products-title" className="border-t border-ink-800 bg-ink-950">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28 xl:pl-20">
        <Reveal className="max-w-3xl">
          <p className="eyebrow">Products</p>
          <h2
            id="products-title"
            className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance text-ink-50 sm:text-5xl"
          >
            Start with CMS today. <span className="text-brand-gradient">More is on the way.</span>
          </h2>
          <p className="mt-5 text-lg text-pretty text-ink-400">
            Viewixsoft CMS is available now. Viewixsoft POS, Tracking and NFC are coming soon and will connect to the
            same CMS, so the screens you set up today are ready for them.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 lg:grid-cols-5">
          {available.map((p) => (
            <Reveal key={p.slug} variant="left" className="flex lg:col-span-3">
              <AvailableCard product={p} />
            </Reveal>
          ))}
          <ul className="grid gap-5 lg:col-span-2">
            {upcoming.map((p, i) => (
              <li key={p.slug}>
                <Reveal variant="right" delay={120 + i * 100} className="h-full">
                  <ComingSoonCard product={p} />
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function AvailableCard({ product }: { product: Product }) {
  return (
    <article className="relative flex w-full flex-col overflow-hidden rounded-3xl border border-ink-800 bg-ink-900 p-8 sm:p-10">
      {/* Soft brand glow behind the flagship card. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-[radial-gradient(circle,var(--color-signal-800),transparent_70%)] opacity-60"
      />

      <div className="relative">
        <span className="inline-flex items-center gap-2 rounded-full border border-signal-800 bg-signal-950 px-3 py-1 text-xs font-semibold text-signal-300">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-signal-400" />
          Available now
        </span>
      </div>

      <h3 className="relative mt-6 font-display text-3xl font-semibold tracking-tight text-ink-50">{product.name}</h3>
      <p className="relative mt-3 max-w-md text-lg text-ink-400">{PRODUCT_ONE_LINERS[product.slug]}</p>

      <ul className="relative mt-8 grid gap-3 sm:grid-cols-2">
        {CMS_FEATURES.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-ink-200">
            <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-signal-400" />
            {f}
          </li>
        ))}
      </ul>

      <div className="relative mt-auto flex flex-wrap items-center gap-3 pt-10">
        <Link
          to="/contact"
          className="bg-brand-gradient shine inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-on-gradient hover:opacity-90"
        >
          Book a demo
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
        <Link
          to="/products/$slug"
          params={{ slug: product.slug }}
          preload="intent"
          className="inline-flex items-center gap-2 rounded-lg border border-ink-700 px-5 py-2.5 text-sm font-semibold text-ink-50 hover:border-ink-500"
        >
          Explore {product.name}
        </Link>
      </div>
    </article>
  )
}

function ComingSoonCard({ product }: { product: Product }) {
  return (
    <article className="h-full rounded-2xl border border-dashed border-ink-700 bg-ink-950 p-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="font-display text-lg font-semibold text-ink-50">{product.name}</h3>
          <span className="rounded-full bg-ink-850 px-2.5 py-0.5 font-mono text-[10px] tracking-[0.12em] text-ink-400 uppercase">
            Coming soon
          </span>
        </div>
        <p className="mt-1.5 text-sm text-ink-400">{PRODUCT_ONE_LINERS[product.slug]}</p>
        <Link
          to="/products/$slug"
          params={{ slug: product.slug }}
          preload="intent"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-signal-400 hover:text-signal-300"
        >
          <Bell aria-hidden="true" className="size-3.5" />
          Get notified
        </Link>
      </div>
    </article>
  )
}
