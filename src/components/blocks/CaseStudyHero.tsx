import { Link } from '@tanstack/react-router'
import {
  ChartColumn,
  CalendarClock,
  Layers,
  MapPin,
  Monitor,
  Nfc,
  RefreshCw,
  ShieldCheck,
  Tag,
  Users,
  WifiOff,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { CaseStudyModeBadge } from '~/components/blocks/CaseStudyModeBadge'
import type { CaseStudyMode, Highlight, HighlightIcon, Reviewer } from '~/lib/case-study'

const ICONS: Record<HighlightIcon, LucideIcon> = {
  'calendar-clock': CalendarClock,
  monitor: Monitor,
  refresh: RefreshCw,
  'map-pin': MapPin,
  chart: ChartColumn,
  tag: Tag,
  'wifi-off': WifiOff,
  layers: Layers,
  tap: Nfc,
  users: Users,
  shield: ShieldCheck,
  zap: Zap,
}

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })

/**
 * Title, one product link and the answer-first summary, the thumbnail as the
 * lead image, then up to three outcomes in a row. Plain line icons with no
 * tile behind them.
 */
export function CaseStudyHero({
  title,
  summary,
  mode,
  updatedAt,
  reviewedBy,
  product,
  cover,
  highlights,
}: {
  title: string
  summary: string
  mode: CaseStudyMode
  updatedAt: string
  reviewedBy: Reviewer | null | undefined
  /** The product to explore first; the button is left out when there is none to link to. */
  product: { slug: string; name: string } | null
  /** The thumbnail, shown as the page's lead image the same way a blog post shows it. */
  cover: { src: string; alt: string }
  highlights: Highlight[]
}) {
  return (
    <header className="space-y-16 md:space-y-24">
      <div className="space-y-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row">
          <h1 className="max-w-2xl font-display text-4xl font-medium tracking-tight text-balance text-ink-50 sm:text-5xl">
            {title}
          </h1>
          {product && (
            <Link
              to="/products/$slug"
              params={{ slug: product.slug }}
              preload="intent"
              aria-label={`Explore ${product.name}`}
              className="shrink-0 rounded-full border border-ink-800 bg-ink-900 px-6 py-3 text-sm font-medium text-ink-50 transition-colors hover:border-ink-600"
            >
              Explore product
            </Link>
          )}
        </div>
        <p className="max-w-2xl text-lg leading-relaxed text-pretty text-ink-300">{summary}</p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs text-ink-400">
          <CaseStudyModeBadge mode={mode} />
          <span>
            Updated <time dateTime={updatedAt}>{formatDate(updatedAt)}</time>
          </span>
          {reviewedBy && (
            <span>
              Reviewed by {reviewedBy.name}, {reviewedBy.role}
            </span>
          )}
        </p>
      </div>

      <img
        src={cover.src}
        alt={cover.alt}
        width={1600}
        height={900}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="aspect-video w-full rounded-3xl border border-ink-800 object-cover"
      />

      {highlights.length > 0 && (
        <ul className="grid grid-cols-1 gap-x-12 gap-y-12 md:grid-cols-3">
          {highlights.map((h) => {
            const Icon = ICONS[h.icon]
            return (
              <li key={h.title} className="space-y-3">
                <Icon aria-hidden="true" strokeWidth={1.5} className="size-11 text-ink-50" />
                <h2 className="pt-2 text-xl font-medium text-ink-50">{h.title}</h2>
                <p className="leading-relaxed text-ink-400">{h.description}</p>
              </li>
            )
          })}
        </ul>
      )}
    </header>
  )
}
