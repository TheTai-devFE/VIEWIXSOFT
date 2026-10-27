import { Link } from '@tanstack/react-router'
import { Activity, Monitor, MonitorPlay, Nfc, Receipt } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { CaseStudyFeatureArt, motifFor } from '~/components/blocks/CaseStudyFeatureArt'
import { useProducts } from '~/lib/use-site-config'
import type { SetupItem } from '~/lib/case-study'
import { cn } from '~/lib/cn'

const ICONS: Record<string, LucideIcon> = { cms: MonitorPlay, pos: Receipt, tracking: Activity, nfc: Nfc }

// Each product keeps its own light colour from the brand tokens.
const TINT: Record<string, string> = {
  cms: 'text-light-cms',
  pos: 'text-light-pos',
  tracking: 'text-light-tracking',
  nfc: 'text-light-nfc',
}

/**
 * The recommended products as dark cards: what each product does in this
 * industry and whether it is core, an add-on or not released yet. Dark in both
 * themes (`screen-dark`), like a lit screen.
 */
export function CaseStudyFeatureCards({ industry, items }: { industry: string; items: SetupItem[] }) {
  const products = useProducts()
  if (items.length === 0) return null

  return (
    <section id="setup" aria-labelledby="setup-heading" className="scroll-mt-24 space-y-10 border-t border-ink-800 pt-12">
      <h2 id="setup-heading" className="max-w-2xl font-display text-3xl font-medium tracking-tight text-balance text-ink-50 sm:text-4xl">
        Viewixsoft products for {industry.toLowerCase()}
      </h2>
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const product = products.find((p) => p.slug === item.productSlug)
          const comingSoon = product?.status === 'coming-soon'
          const Icon = (item.productSlug && ICONS[item.productSlug]) || Monitor
          const tint = (item.productSlug && TINT[item.productSlug]) || 'text-signal-400'
          let need = item.need === 'core' ? 'Core' : 'Add-on'
          if (!item.productSlug) need = 'Hardware'
          if (comingSoon) need = 'Coming soon'

          return (
            <li
              key={`${item.productSlug ?? 'other'}-${item.name}`}
              className="screen-dark group relative isolate flex min-h-[26rem] flex-col justify-between overflow-hidden rounded-3xl border border-ink-800 bg-ink-900 p-8 shadow-xl"
            >
              <div className={cn('absolute inset-0 -z-10 opacity-80 transition-opacity duration-500 group-hover:opacity-100', tint)}>
                <CaseStudyFeatureArt motif={motifFor(item.productSlug)} />
              </div>
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/80 to-transparent" />

              <div className="flex items-start justify-between gap-4">
                <Icon aria-hidden="true" strokeWidth={1.5} className={cn('size-8', tint)} />
                <span
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-wide uppercase',
                    need === 'Coming soon' ? 'border-warning/40 text-warning' : 'border-ink-600 text-ink-200',
                  )}
                >
                  {need}
                </span>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-ink-50">
                  {product ? (
                    <Link
                      to="/products/$slug"
                      params={{ slug: product.slug }}
                      preload="intent"
                      className="after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-signal-400"
                    >
                      {product.name}
                    </Link>
                  ) : (
                    item.name
                  )}
                </h3>
                {item.role && <p className="leading-relaxed text-ink-300">{item.role}</p>}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
