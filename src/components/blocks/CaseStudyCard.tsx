import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import type { UseCase } from '~/content/useCases'
import { CaseStudyModeBadge } from '~/components/blocks/CaseStudyModeBadge'

/** One industry or customer story in a grid. Figures appear only on approved customer stories. */
export function CaseStudyCard({ useCase: uc, eager = false }: { useCase: UseCase; eager?: boolean }) {
  const topMetrics = uc.mode === 'story' ? uc.results.slice(0, 2) : []

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-ink-800 bg-ink-900/60 transition-colors duration-300 hover:border-signal-500/40 hover:bg-ink-900">
      <div className="relative aspect-video w-full overflow-hidden bg-ink-950">
        <img
          src={uc.cover.src}
          alt={uc.cover.alt}
          width={960}
          height={540}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
        />
        <div className="absolute top-4 left-4">
          <CaseStudyModeBadge mode={uc.mode} className="backdrop-blur-md" />
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-6 p-6 sm:p-7">
        <div className="space-y-3">
          <p className="font-mono text-xs tracking-wider text-ink-400 uppercase">{uc.industry}</p>
          <h3 className="font-display text-xl font-bold tracking-tight text-ink-50 transition-colors group-hover:text-signal-300 sm:text-2xl">
            <Link
              to="/case-studies/$slug"
              params={{ slug: uc.slug }}
              preload="intent"
              className="after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-4 focus-visible:after:ring-offset-background"
            >
              {uc.title}
            </Link>
          </h3>
          <p className="line-clamp-3 text-sm leading-relaxed text-ink-300">{uc.tagline}</p>

          {topMetrics.length > 0 && (
            <dl className="grid grid-cols-2 gap-3 pt-1">
              {topMetrics.map((r) => (
                <div key={r.label}>
                  <dt className="sr-only">{r.label}</dt>
                  <dd className="font-mono text-lg font-bold text-signal-400 tabular-nums">{r.metric}</dd>
                  <dd className="text-xs text-ink-400">{r.label}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-ink-800/80 pt-4">
          <ul className="flex flex-wrap gap-1.5" aria-label="Products">
            {uc.featuredProducts.map((p) => (
              <li key={p.slug} className="rounded-md border border-ink-800 bg-ink-950 px-2 py-0.5 font-mono text-[10px] text-ink-300">
                {p.name}
              </li>
            ))}
          </ul>
          <ArrowUpRight
            aria-hidden="true"
            className="size-4 shrink-0 text-signal-400 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </div>
      </div>
    </article>
  )
}
