import { Link } from '@tanstack/react-router'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { ThreeDMarquee } from '~/components/ui/3d-marquee'
import { USE_CASES } from '~/content/useCases'
import { Reveal } from '~/components/ui/reveal'
import { useScreenWall } from '~/lib/use-media'

export function UseCasesSection() {
  // Screen photos are picked from the library in /admin/pages → Home → Use cases.
  const wallImages = useScreenWall()
  return (
    <section aria-labelledby="use-cases-title" className="overflow-hidden border-t border-ink-800 bg-ink-950">
      <div className="page-x section-y grid items-center gap-12 lg:grid-cols-2">
        <div>
          <Reveal>
            <p className="eyebrow">Industries we serve</p>
            <h2
              id="use-cases-title"
              className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance text-ink-50 sm:text-5xl"
            >
              Digital Signage for <span className="text-brand-gradient">Every Industry.</span>
            </h2>
            <p className="mt-5 max-w-xl text-lg text-pretty text-ink-400">
              From retail and restaurants to corporate environments and hospitality, Viewixsoft provides digital signage
              software solutions that help businesses manage displays and deliver the right content in the right place.
            </p>
          </Reveal>

          <ul className="mt-10 divide-y divide-ink-800 border-y border-ink-800">
            {USE_CASES.map((uc, i) => (
              <li key={uc.slug}>
                <Reveal delay={i * 70}>
                  <Link
                    to="/use-cases/$slug"
                    params={{ slug: uc.slug }}
                    preload="intent"
                    className="group flex items-center justify-between gap-4 py-4"
                  >
                    <span className="min-w-0">
                      <span className="block font-mono text-[11px] tracking-[0.12em] text-ink-500 uppercase">
                        {uc.industry}
                      </span>
                      <span className="mt-1 block font-semibold text-ink-50 group-hover:text-signal-400">{uc.title}</span>
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-ink-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-signal-400 motion-reduce:transition-none"
                    />
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>

          <Link
            to="/use-cases"
            preload="intent"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-signal-400 hover:text-signal-300"
          >
            Browse all use cases
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        {/* Decorative: the wall repeats photos, so it is hidden from assistive tech. */}
        <Reveal variant="scale" delay={150}>
          <div aria-hidden="true" className="relative">
            <ThreeDMarquee images={wallImages} className="max-sm:h-80" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,var(--color-ink-950))]" />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
