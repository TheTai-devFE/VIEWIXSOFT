import { useId } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { Screen } from '~/components/story/primitives/Screen'
import { SCREEN_RANGES, SUPPORTED_HARDWARE } from '~/components/story/story-content'

const BUNDLES = [
  {
    name: 'Programmatic DOOH engine',
    nodes: [
      { slug: 'cms', name: 'Viewixsoft CMS', light: 'bg-light-cms' },
      { slug: 'tracking', name: 'Viewixsoft Tracking', light: 'bg-light-tracking' },
    ],
  },
  {
    name: 'Connected retail network',
    nodes: [
      { slug: 'pos', name: 'Viewixsoft POS', light: 'bg-light-pos' },
      { slug: 'nfc', name: 'Viewixsoft NFC', light: 'bg-light-nfc' },
    ],
  },
] as const


/**
 * Chapter 6 is not pinned: it holds a form, and forms should never fight
 * the scroll. The quick form is a plain GET to /contact, which prefills the
 * full demo form (all validation and lead capture live there).
 */
export function Scene6Finale() {
  const emailId = useId()
  const screensId = useId()

  return (
    <section id="ch-your-network" aria-labelledby="ch-your-network-title" className="scroll-mt-16 border-t border-ink-800">
      <div className="page-x py-20 lg:py-28 xl:pl-20">
        <div className="max-w-2xl">
          <p className="eyebrow">CH 06 · Your network</p>
          <h2 id="ch-your-network-title" className="mt-3 font-display text-scene font-semibold tracking-tight text-balance text-ink-50">
            Ready to Build Your Screen Network?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-300 lg:text-lg">
            Deploy Viewixsoft across 10 or 10,000 screens in hours with hardware-agnostic players, unified cloud CMS, and end-to-end telemetry.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Bundles, wired together */}
          <div className="space-y-4 lg:col-span-5">
            <h3 className="eyebrow text-ink-400">Products that work together</h3>
            {BUNDLES.map((b) => (
              <div key={b.name} className="rounded-lg border border-ink-800 p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-400">{b.name}</p>
                <div className="mt-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                  <BundleNode {...b.nodes[0]} />
                  <span aria-hidden="true" className="hidden h-px min-w-3 flex-1 bg-signal-500 sm:block" />
                  <span className="font-mono text-xs text-signal-400">+</span>
                  <span aria-hidden="true" className="hidden h-px min-w-3 flex-1 bg-signal-500 sm:block" />
                  <BundleNode {...b.nodes[1]} />
                </div>
              </div>
            ))}

            <div className="pt-4">
              <h3 className="eyebrow text-ink-400">Runs on</h3>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {SUPPORTED_HARDWARE.map((h) => (
                  <li key={h} className="rounded-sm border border-ink-800 px-2 py-1 font-mono text-[11px] text-ink-300">
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* The original screen returns, with the form under it */}
          <div className="lg:col-span-7">
            <Screen className="aspect-video" displayClassName="bg-ink-900">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-signal-400 sm:text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-signal-400" /> Awaiting signal
                </span>
                <p className="font-display text-3xl font-semibold tracking-tight text-ink-50 sm:text-5xl">Your screen, next.</p>
              </div>
            </Screen>

            <form action="/contact" method="get" className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <div>
                <label htmlFor={emailId} className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-400">
                  Work email
                </label>
                <input
                  id={emailId}
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2.5 text-sm text-ink-50 placeholder:text-ink-500 focus:border-signal-400"
                />
              </div>
              <div>
                <label htmlFor={screensId} className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-400">
                  Screens
                </label>
                <select
                  id={screensId}
                  name="screens"
                  defaultValue={SCREEN_RANGES[1]}
                  className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2.5 text-sm text-ink-50 focus:border-signal-400"
                >
                  {SCREEN_RANGES.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-gradient shine px-5 py-2.5 text-sm font-semibold text-on-gradient transition-colors hover:opacity-90"
              >
                Request demo
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-3 text-xs text-ink-500">
              Next you’ll add a few details about your network. See our{' '}
              <Link to="/legal/privacy" className="underline underline-offset-4 hover:text-ink-200">
                privacy policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function BundleNode({ slug, name, light }: { slug: string; name: string; light: string }) {
  return (
    <Link
      to="/products/$slug"
      params={{ slug }}
      className="flex shrink-0 items-center gap-2 rounded-md border border-ink-700 bg-ink-900 px-2.5 py-2 text-xs font-semibold text-ink-50 transition-colors hover:border-ink-500 sm:text-sm"
    >
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${light}`} />
      {name}
    </Link>
  )
}
