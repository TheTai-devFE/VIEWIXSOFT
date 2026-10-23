import { Link } from '@tanstack/react-router'
import { ArrowRight, BedDouble, Building2, HeartPulse, Store, UtensilsCrossed } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Reveal } from '~/components/ui/reveal'
import { USE_CASES } from '~/content/useCases'
import type { UseCase } from '~/content/useCases'
import { cn } from '~/lib/cn'
import { SHOW_SAMPLE_CONTENT } from '~/lib/site-config'
import { imageUrl, useMedia } from '~/lib/use-media'
import { useSectionContent } from '~/lib/use-section-content'

const TONES = ['result-card-1', 'result-card-2', 'result-card-3'] as const

const MONOGRAMS: Record<string, LucideIcon> = {
  retail: Store,
  'qsr-menu-boards': UtensilsCrossed,
  'corporate-comms': Building2,
  hospitality: BedDouble,
  healthcare: HeartPulse,
}

/**
 * Up to three use cases with two result figures each. Sample stories show in
 * the dev server only, so production shows only `verified` results.
 */
export function resultStories(): UseCase[] {
  return USE_CASES.filter((uc) => (SHOW_SAMPLE_CONTENT || uc.evidence === 'verified') && uc.results.length >= 2).slice(0, 3)
}

export function AboutResults({ stories }: { stories: UseCase[] }) {
  const { eyebrow, title, description, cta } = useSectionContent('about:results')
  const words = title.split(' ')
  return (
    <section aria-labelledby="results-heading" className="page-x pt-14 pb-10 md:pt-20 md:pb-14">
      <Reveal variant="fade" className="group mx-auto max-w-3xl text-center">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2
          id="results-heading"
          className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance text-ink-50 sm:text-4xl lg:text-5xl"
        >
          {words.map((word, i) => (
            <span
              // Words repeat ("with", "the"), so the index keeps keys unique.
              key={`${word}-${i}`}
              style={{ animationDelay: `${i * 60}ms` }}
              className="inline-block motion-safe:group-data-[reveal=shown]:animate-word-rise"
            >
              {word}
              {i < words.length - 1 && ' '}
            </span>
          ))}
        </h2>
        {description && (
          <p
            style={{ animationDelay: `${words.length * 60}ms` }}
            className="mx-auto mt-5 max-w-2xl text-pretty text-ink-400 motion-safe:group-data-[reveal=shown]:animate-word-rise"
          >
            {description}
          </p>
        )}
        <span
          aria-hidden="true"
          style={{ animationDelay: `${words.length * 60 + 200}ms` }}
          className="mx-auto mt-8 block h-px w-16 origin-center bg-ink-700 motion-safe:group-data-[reveal=shown]:animate-rule-draw"
        />
      </Reveal>

      <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stories.map((story, i) => (
          <li key={story.slug} className={cn(i === 2 && 'md:col-span-2 lg:col-span-1')}>
            <Reveal delay={200 + i * 120} className="h-full">
              <ResultCard story={story} tone={TONES[i % TONES.length] ?? 'result-card-1'} />
            </Reveal>
          </li>
        ))}
      </ul>

      <Reveal delay={200 + stories.length * 120} className="mt-10 flex justify-center">
        <Link
          to="/use-cases"
          preload="intent"
          className="inline-flex items-center gap-2 rounded-full border border-ink-800 bg-ink-950 px-5 py-2.5 text-sm font-medium text-ink-50 transition-colors duration-(--duration-base) hover:border-ink-500"
        >
          {cta}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </Reveal>
    </section>
  )
}

function ResultCard({ story, tone }: { story: UseCase; tone: (typeof TONES)[number] }) {
  const photo = useMedia(`use-case.${story.slug}.cover`)
  const Monogram = MONOGRAMS[story.slug]
  const stats = story.results.slice(0, 2)
  return (
    <article
      className={cn(
        'screen-dark group relative flex h-full flex-col lg:min-h-[34rem] overflow-hidden rounded-2xl p-6 text-ink-50 transition-transform duration-(--duration-base) ease-(--ease-broadcast) hover:-translate-y-1 has-[a:focus-visible]:-translate-y-1',
        tone,
      )}
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-semibold">
            {/* The link covers the whole card; the heading names it. */}
            <Link
              to="/use-cases/$slug"
              params={{ slug: story.slug }}
              preload="intent"
              className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-ink-50"
            >
              {story.quote.company}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-ink-200">{story.title}</p>
        </div>
        {Monogram && <Monogram aria-hidden="true" strokeWidth={1.5} className="size-6 shrink-0 text-ink-50" />}
      </header>

      <dl className="mt-8 grid grid-cols-2 divide-x divide-ink-50/30">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col pr-4 last:pr-0 last:pl-4">
            <dt className="order-2 mt-2 text-sm leading-snug text-ink-100">{stat.label}</dt>
            <dd className="order-1 font-display text-4xl font-semibold tracking-tight">{stat.metric}</dd>
          </div>
        ))}
      </dl>

      {photo && (
        <div className="relative mt-auto pt-12">
          {/* Paper layers peek out above the photo and fan out on hover. */}
          <span
            aria-hidden="true"
            className="absolute inset-x-6 top-4 bottom-0 rounded-xl bg-ink-50/15 transition-transform duration-(--duration-base) ease-(--ease-broadcast) group-hover:-translate-y-1.5 group-hover:-rotate-2"
          />
          <span
            aria-hidden="true"
            className="absolute inset-x-3 top-8 bottom-0 rounded-xl bg-ink-50/25 transition-transform duration-(--duration-base) ease-(--ease-broadcast) group-hover:-translate-y-1 group-hover:rotate-1"
          />
          <img
            src={imageUrl(photo.src, 800)}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            loading="lazy"
            className="relative aspect-[3/2] w-full rounded-xl object-cover"
          />
        </div>
      )}
    </article>
  )
}
