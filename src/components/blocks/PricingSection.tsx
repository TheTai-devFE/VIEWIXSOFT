import { useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Check, Mail, Minus, Phone, Plus } from 'lucide-react'
import { SectionHeading } from '~/components/blocks/SectionHeading'
import { Reveal } from '~/components/ui/reveal'
import { formatUsd } from '~/data/pricing'
import { pricingIntroText } from '~/lib/pricing'
import type { PricingPlans } from '~/lib/pricing'
import { useSiteConfig } from '~/lib/use-site-config'
import { usePricing } from '~/lib/use-pricing'
import { cn } from '~/lib/cn'
import { useSectionContent } from '~/lib/use-section-content'

const TABS = ['Yearly', 'Customer Server', 'Enterprise'] as const

const ctaPrimary =
  'bg-brand-gradient inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-on-gradient hover:opacity-90'

/** `showIntro={false}` drops the H2 intro when the page header already says it (e.g. /pricing). */
export function PricingSection({ showIntro = true }: { showIntro?: boolean }) {
  const prices = usePricing()
  const edited = useSiteConfig().content['product-cms:pricing'] !== undefined
  const saved = useSectionContent('product-cms:pricing')
  // Until the intro is edited, it quotes the prices as they are now.
  const intro = edited ? saved : { ...saved, description: pricingIntroText(prices) }
  const [tab, setTab] = useState(0)
  const baseId = useId()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Left/Right move between tabs, per the WAI-ARIA tabs pattern.
  function onTabKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const next = (tab + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length
    setTab(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <section
      aria-labelledby={showIntro ? 'pricing-title' : undefined}
      aria-label={showIntro ? undefined : 'Viewixsoft CMS plans'}
      className="scroll-mt-24"
      id="pricing"
    >
      {showIntro && (
        <SectionHeading id="pricing-title" eyebrow={intro.eyebrow} title={intro.title} description={intro.description} />
      )}

      <Reveal delay={100} className="mt-10 flex justify-center">
        <div role="tablist" aria-label="Pricing plans" className="inline-flex rounded-xl border border-ink-800 bg-ink-900 p-1">
          {TABS.map((label, i) => (
            <button
              key={label}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${i}`}
              aria-selected={tab === i}
              aria-controls={`${baseId}-panel-${i}`}
              tabIndex={tab === i ? 0 : -1}
              onClick={() => setTab(i)}
              onKeyDown={onTabKey}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-semibold transition-colors sm:px-5',
                tab === i ? 'bg-ink-950 text-ink-50 shadow-sm' : 'text-ink-400 hover:text-ink-200',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </Reveal>

      {/* Every panel ships in the SSR HTML so all prices stay crawlable. */}
      <div className="mt-8">
        <TabPanel baseId={baseId} index={0} active={tab}>
          <YearlyPanel prices={prices} onNeedServer={() => setTab(1)} />
        </TabPanel>
        <TabPanel baseId={baseId} index={1} active={tab}>
          <CustomerServerPanel prices={prices} />
        </TabPanel>
        <TabPanel baseId={baseId} index={2} active={tab}>
          <EnterprisePanel prices={prices} />
        </TabPanel>
      </div>
    </section>
  )
}

function TabPanel({ baseId, index, active, children }: { baseId: string; index: number; active: number; children: React.ReactNode }) {
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${index}`}
      aria-labelledby={`${baseId}-tab-${index}`}
      hidden={active !== index}
      tabIndex={0}
      className="outline-none"
    >
      {children}
    </div>
  )
}

function YearlyPanel({ prices, onNeedServer }: { prices: PricingPlans; onNeedServer: () => void }) {
  const { termPlans, termFeatures, maxOnlineLicences: maxOnline, customerServer } = prices
  const [years, setYears] = useState<number>(1)
  const [count, setCount] = useState(1)
  const plan = termPlans.find((p) => p.years === years) ?? termPlans[0]
  if (!plan) return null
  const total = plan.price * count
  const termLabel = plan.years === 1 ? '1 year' : `${plan.years} years`

  return (
    <div>
      <fieldset>
        <legend className="sr-only">Choose a licence term</legend>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {termPlans.map((p) => {
            const selected = p.years === years
            const label = p.years === 1 ? '1 year' : `${p.years} years`
            return (
              <label
                key={p.years}
                className={cn(
                  'relative flex cursor-pointer flex-col rounded-2xl border p-5 transition-colors has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50',
                  selected ? 'border-signal-400 bg-signal-950' : 'border-ink-800 bg-ink-950 hover:border-ink-600',
                )}
              >
                {p.bestValue && (
                  <span className="bg-brand-gradient absolute -top-2.5 right-4 rounded-full px-2.5 py-0.5 font-mono text-[10px] tracking-widest text-on-gradient uppercase">
                    Best value
                  </span>
                )}
                <span className="flex items-center gap-2 text-sm font-semibold text-ink-50">
                  <input
                    type="radio"
                    name="licence-term"
                    value={p.years}
                    checked={selected}
                    onChange={() => setYears(p.years)}
                    className="size-4 accent-signal-500"
                  />
                  {label}
                </span>
                <span className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink-50">
                  {formatUsd(p.price)}
                </span>
                <span className="mt-1 text-xs text-ink-400">per licence / {label}</span>
                <span className="mt-4 border-t border-ink-800 pt-3 text-sm text-ink-300">
                  ≈ {formatUsd(p.price / p.years)} / year
                </span>
                {p.save > 0 && (
                  <span className="mt-2 w-fit rounded-full bg-signal-950 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-signal-300 uppercase">
                    Save {p.save}%
                  </span>
                )}
              </label>
            )
          })}
        </div>
      </fieldset>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {termFeatures.map((f) => (
          <li key={f.id} className="flex items-center gap-2 text-sm text-ink-300">
            <Check aria-hidden="true" className="size-4 shrink-0 text-signal-400" />
            {f.text}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col gap-5 rounded-2xl border border-ink-800 bg-ink-900 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="licence-count" className="text-sm font-semibold text-ink-50">
            Licences
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Remove a licence"
              onClick={() => setCount((c) => Math.max(1, c - 1))}
              disabled={count <= 1}
              className="flex size-9 items-center justify-center rounded-md border border-ink-700 text-ink-200 hover:border-ink-500 disabled:opacity-40"
            >
              <Minus aria-hidden="true" className="size-4" />
            </button>
            <input
              id="licence-count"
              type="number"
              inputMode="numeric"
              min={1}
              max={maxOnline}
              value={count}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10)
                setCount(Number.isNaN(n) ? 1 : Math.min(maxOnline, Math.max(1, n)))
              }}
              aria-describedby="licence-count-hint"
              className="h-9 w-16 rounded-md border border-ink-700 bg-ink-950 text-center text-sm text-ink-50"
            />
            <button
              type="button"
              aria-label="Add a licence"
              onClick={() => setCount((c) => Math.min(maxOnline, c + 1))}
              disabled={count >= maxOnline}
              className="flex size-9 items-center justify-center rounded-md border border-ink-700 text-ink-200 hover:border-ink-500 disabled:opacity-40"
            >
              <Plus aria-hidden="true" className="size-4" />
            </button>
          </div>
          <p id="licence-count-hint" className="text-xs text-ink-400">
            Up to {maxOnline} online.{' '}
            <button type="button" onClick={onNeedServer} className="font-semibold text-signal-400 hover:text-signal-300">
              {customerServer.minLicences}+ licences: Customer Server
            </button>
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
          <div className="sm:text-right" aria-live="polite">
            <p className="text-xs text-ink-400">
              {count} × {formatUsd(plan.price)} · {termLabel}
            </p>
            <p className="font-display text-3xl font-semibold tracking-tight text-ink-50">{formatUsd(total)}</p>
          </div>
          {/* TODO(content): switch to online checkout once a payment provider is approved. */}
          <Link to="/contact" className={ctaPrimary}>
            Buy licences
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-500">Prices in USD, per screen licence.</p>
    </div>
  )
}

function CustomerServerPanel({ prices }: { prices: PricingPlans }) {
  const { minLicences, endUserPrice, resellerPriceFrom, resellerPriceTo, resellerDiscount, volumeDiscounts } =
    prices.customerServer
  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-ink-800 bg-ink-950 p-6">
          <h3 className="font-display text-lg font-semibold text-ink-50">End user (enterprise)</h3>
          <p className="mt-1 text-sm text-ink-400">Minimum {minLicences} licences</p>
          <p className="mt-5 font-display text-3xl font-semibold tracking-tight text-ink-50">
            {formatUsd(endUserPrice)}
            <span className="ml-1 text-sm font-normal text-ink-400">/ licence</span>
          </p>
          <p className="mt-2 text-sm text-ink-300">
            ≈ {formatUsd(endUserPrice * minLicences)} for {minLicences} licences
          </p>
        </div>
        <div className="rounded-2xl border border-ink-800 bg-ink-950 p-6">
          <h3 className="font-display text-lg font-semibold text-ink-50">SI / reseller</h3>
          <p className="mt-1 text-sm text-ink-400">
            Minimum {minLicences} licences · {resellerDiscount}
          </p>
          <p className="mt-5 font-display text-3xl font-semibold tracking-tight text-ink-50">
            {formatUsd(resellerPriceFrom)} – {formatUsd(resellerPriceTo)}
            <span className="ml-1 text-sm font-normal text-ink-400">/ licence</span>
          </p>
          <p className="mt-2 text-sm text-ink-300">
            ≈ {formatUsd(resellerPriceFrom * minLicences)} for {minLicences} licences
          </p>
        </div>
      </div>

      {volumeDiscounts.length > 0 && (
        <div className="mt-4 rounded-2xl border border-ink-800 bg-ink-950 p-6">
          <h3 className="text-sm font-semibold text-ink-50">Volume discounts</h3>
          <ul className="mt-3 space-y-2">
            {volumeDiscounts.map((d) => (
              <li key={d.id} className="flex items-center gap-2 text-sm text-ink-300">
                <Check aria-hidden="true" className="size-4 shrink-0 text-signal-400" />
                {d.licences} licences: {d.percentOff}% off (end user ≈ {formatUsd(d.endUserPrice)} / licence)
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <Link to="/contact" className={ctaPrimary}>
          Contact sales for a quote
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </div>
  )
}

function EnterprisePanel({ prices }: { prices: PricingPlans }) {
  const { sales } = prices
  return (
    <div className="grid gap-4 md:grid-cols-5">
      <div className="rounded-2xl border border-ink-800 bg-ink-950 p-6 md:col-span-3 sm:p-8">
        <h3 className="font-display text-2xl font-semibold text-ink-50">Enterprise</h3>
        <p className="mt-1 text-sm text-ink-400">Custom pricing</p>
        <p className="mt-5 max-w-lg text-pretty text-ink-300">
          For large or multi-country screen networks that need custom licence volumes, contract terms or deployment.
          Tell us about your network and we will prepare a quote.
        </p>
        <Link to="/contact" className={cn(ctaPrimary, 'mt-8')}>
          Contact sales
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      <div className="rounded-2xl border border-ink-800 bg-ink-900 p-6 md:col-span-2 sm:p-8">
        <h3 className="text-sm font-semibold text-ink-50">Talk to sales</h3>
        <ul className="mt-5 space-y-4 text-sm">
          {sales.email && (
            <li className="flex items-start gap-3">
              <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-signal-400" />
              <span>
                <span className="block text-xs text-ink-400">Email</span>
                <a href={`mailto:${sales.email}`} className="font-semibold text-ink-50 hover:text-signal-400">
                  {sales.email}
                </a>
              </span>
            </li>
          )}
          {sales.phone && (
            <li className="flex items-start gap-3">
              <Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-signal-400" />
              <span>
                <span className="block text-xs text-ink-400">Phone</span>
                <a href={`tel:${sales.phone.replace(/\s/g, '')}`} className="font-semibold text-ink-50 hover:text-signal-400">
                  {sales.phone}
                </a>
              </span>
            </li>
          )}
          {sales.hours && <li className="text-xs text-ink-400">{sales.hours}</li>}
        </ul>
      </div>
    </div>
  )
}
