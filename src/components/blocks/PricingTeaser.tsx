import { Link } from '@tanstack/react-router'
import { ArrowRight, CalendarRange, Monitor, ServerCog, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Reveal } from '~/components/ui/reveal'
import { formatUsd } from '~/data/pricing'
import { usePricing } from '~/lib/use-pricing'

interface Fact {
  icon: LucideIcon
  /** Icon colour class; each fact gets its own hue. */
  tone: string
  value: string
  label: string
}

/** Home page price summary; the full table lives on /pricing. Figures come from /admin/pages (Viewixsoft CMS → Pricing). */
export function PricingTeaser() {
  const prices = usePricing()
  const oneYear = prices.termPlans.find((p) => p.years === 1)
  const best = prices.termPlans.find((p) => p.bestValue)
  if (!oneYear) return null

  const facts: Fact[] = [
    { icon: Monitor, tone: 'text-signal-500', value: formatUsd(oneYear.price), label: 'per screen license per year' },
    ...(best
      ? [{ icon: CalendarRange, tone: 'text-gradient-from', value: `${best.save}%`, label: `saved on a ${best.years}\u2011year plan` }]
      : []),
    {
      icon: ServerCog,
      tone: 'text-success',
      value: `${prices.customerServer.minLicences}+`,
      label: 'screens can self\u2011host on your own server',
    },
    { icon: ShieldCheck, tone: 'text-warning', value: 'Flexible', label: 'scalable plans for businesses of all sizes' },
  ]

  return (
    <section aria-labelledby="pricing-teaser-title" className="relative overflow-hidden border-t border-ink-800 bg-ink-950">
      {/* Soft violet glow behind the cards; decorative only. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-[-10%] size-168 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,var(--color-signal-500),transparent)] opacity-[0.07]"
      />

      <div className="page-x section-y relative grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <Reveal>
          <p className="eyebrow">Pricing</p>
          <h2
            id="pricing-teaser-title"
            className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance text-ink-50 sm:text-5xl"
          >
            Flexible Pricing for <span className="text-brand-gradient">Growing Businesses</span>.
          </h2>
          <p className="mt-5 max-w-xl text-lg text-pretty text-ink-400">
            Viewixsoft offers transparent and flexible pricing, designed to fit your business needs. Whether you&apos;re
            running a single screen or managing a network, you only pay for what you use.
          </p>
          <Link
            to="/pricing"
            preload="intent"
            className="bg-brand-gradient shine mt-8 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-on-gradient hover:opacity-90"
          >
            View pricing plans
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Reveal>

        {/* Two by two at every width: four in a row leaves cards too narrow for the figures. */}
        <ul className="grid grid-cols-2 gap-3 sm:gap-4">
          {facts.map((f, i) => {
            const Icon = f.icon
            return (
              <li key={f.label}>
                <Reveal variant="fade" delay={120 + i * 80} className="h-full">
                  <div className="flex h-full flex-col rounded-2xl border border-ink-800 bg-ink-950 p-4 shadow-[0_1px_2px_var(--color-stage-shadow),0_12px_32px_-16px_var(--color-stage-shadow)] transition-transform duration-(--duration-base) ease-broadcast motion-safe:hover:-translate-y-1 sm:p-6">
                    <Icon aria-hidden="true" className={`size-7 ${f.tone}`} strokeWidth={1.75} />
                    {/* text-2xl on phones keeps "Flexible" inside a 150 px card at 360 px wide. */}
                    <p className="mt-5 font-display text-2xl font-semibold tracking-tight text-ink-50 sm:text-4xl">
                      {f.value}
                    </p>
                    <p className="mt-2 text-sm text-balance text-ink-400 sm:text-base">{f.label}</p>
                  </div>
                </Reveal>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
