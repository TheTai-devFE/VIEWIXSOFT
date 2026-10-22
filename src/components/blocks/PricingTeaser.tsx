import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { Reveal } from '~/components/ui/reveal'
import { CUSTOMER_SERVER, TERM_PLANS, formatUsd } from '~/data/pricing'

/** Home page price summary; the full table lives on /pricing. */
export function PricingTeaser() {
  const oneYear = TERM_PLANS.find((p) => p.years === 1)
  const best = TERM_PLANS.find((p) => p.bestValue)
  if (!oneYear) return null

  const facts = [
    { value: formatUsd(oneYear.price), label: 'per screen licence per year' },
    ...(best ? [{ value: `${best.save ?? 0}%`, label: `saved on a ${best.years}-year plan` }] : []),
    { value: `${CUSTOMER_SERVER.minLicences}+`, label: 'screens can self-host on your own server' },
  ]

  return (
    <section aria-labelledby="pricing-teaser-title" className="border-t border-ink-800 bg-ink-950">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
        <Reveal>
          <p className="eyebrow">Pricing</p>
          <h2
            id="pricing-teaser-title"
            className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance text-ink-50 sm:text-5xl"
          >
            How much does Viewixsoft CMS cost?
          </h2>
          <p className="mt-5 text-lg text-pretty text-ink-400">
            Viewixsoft CMS costs {formatUsd(oneYear.price)} per screen licence per year. You pay per screen, so a
            network of 10 screens costs {formatUsd(oneYear.price * 10)} a year on the 1-year plan.
          </p>
          <Link
            to="/pricing"
            preload="intent"
            className="mt-8 inline-flex items-center gap-2 rounded-lg border border-ink-700 px-5 py-2.5 text-sm font-semibold text-ink-50 hover:border-ink-500"
          >
            See all plans
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Reveal>

        <Reveal variant="fade" delay={120}>
          <dl className="grid gap-px overflow-hidden rounded-2xl border border-ink-800 bg-ink-800 sm:grid-cols-3">
            {facts.map((f) => (
              <div key={f.label} className="flex flex-col bg-ink-950 p-6">
                <dt className="order-2 mt-2 text-sm text-ink-400">{f.label}</dt>
                <dd className="order-1 font-display text-4xl font-semibold tracking-tight text-ink-50">{f.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  )
}
