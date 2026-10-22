import { LazyMotion, domAnimation, m, useReducedMotion } from 'motion/react'
import { CalendarClock, ChartColumn, ImageUp, MapPin, MonitorSmartphone } from 'lucide-react'
import { ViewixLogo } from '~/components/blocks/ViewixLogo'
import { cn } from '~/lib/cn'
import { HeroTitle } from '~/components/ui/hero-heading'
import { pageDefaults } from '~/data/page-content'
import type { PageHero } from '~/data/page-content'
import type { LucideIcon } from 'lucide-react'

type OrbitItem = { label: string; icon: LucideIcon }

// What Viewixsoft CMS does, orbiting the CMS hub.
const CMS_FEATURES: OrbitItem[] = [
  { label: 'Connect devices', icon: MonitorSmartphone },
  { label: 'Upload media', icon: ImageUp },
  { label: 'Schedule', icon: CalendarClock },
  { label: 'Analytics', icon: ChartColumn },
  { label: 'Device locations', icon: MapPin },
]

// The list runs twice around the ring, 180° apart: while one copy sinks below
// the horizon its twin rises, so all five features stay on the arc at once.
const OUTER_ORBIT = [...CMS_FEATURES, ...CMS_FEATURES]

const TAGS = ['One cloud dashboard', 'Schedule by time and location', 'Manage screens remotely']

const OUTER_SPIN_S = 60

/**
 * `embedded` drops the full-bleed band (border, background, page gutters) for
 * use inside a page that already has its own container, e.g. /products/cms.
 */
export function WhyChooseSection({
  embedded = false,
  headingLevel = 'h2',
  hero = pageDefaults('product-cms')?.hero,
}: {
  embedded?: boolean
  // h1 where this section opens the page, as on /products/cms.
  headingLevel?: 'h1' | 'h2'
  /** Heading text; on /products/cms it comes from /admin/pages/product-cms. */
  hero?: PageHero
}) {
  const Heading = headingLevel
  return (
    <section
      aria-labelledby="why-title"
      className={cn('overflow-hidden', !embedded && 'border-t border-ink-800 bg-ink-950')}
    >
      <div
        className={cn(
          'grid items-center gap-14 lg:grid-cols-2',
          !embedded && 'mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28 xl:pl-20',
        )}
      >
        <div>
          {hero?.eyebrow && <p className="eyebrow">{hero.eyebrow}</p>}
          <Heading
            id="why-title"
            className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance text-ink-50 sm:text-6xl"
          >
            {hero && <HeroTitle hero={hero} />}
          </Heading>
          {hero?.description && <p className="mt-6 max-w-xl text-lg text-pretty text-ink-400">{hero.description}</p>}
          <ul className="mt-8 flex flex-wrap gap-2">
            {TAGS.map((t) => (
              <li
                key={t}
                className="rounded-full border border-ink-800 bg-ink-900 px-3.5 py-1.5 text-sm text-ink-300"
              >
                {t}
              </li>
            ))}
          </ul>
        </div>

        <OrbitVisual />
      </div>
    </section>
  )
}

function OrbitVisual() {
  const reduce = useReducedMotion() ?? false

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="relative mx-auto w-full max-w-[34rem] px-6 sm:px-0">
        <div aria-hidden="true" className="relative aspect-[2/1.25] w-full">
          {/* Arcs share a center at 80% height; items sink below it as they orbit and fade out. */}
          <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black_66%,transparent_84%)]">
            <Arc sizePct={100} />
            <Arc sizePct={62} />
            <Orbit items={OUTER_ORBIT} sizePct={100} seconds={OUTER_SPIN_S} reduce={reduce} />
          </div>

          {/* Hub: Viewixsoft CMS, outside the mask so it stays fully visible. */}
          <div className="absolute top-[80%] left-1/2 flex -translate-x-1/2 -translate-y-10 flex-col items-center gap-3">
            <span className="bg-brand-gradient shine flex size-20 items-center justify-center rounded-full text-on-gradient shadow-lg ring-8 ring-signal-950">
              <ViewixLogo variant="mark" className="size-10" />
            </span>
            <span className="font-display text-base font-semibold whitespace-nowrap text-ink-50">Viewixsoft CMS</span>
          </div>
        </div>

        {/* Readable list of the same features: visible on phones, where orbit labels
            would collide, and the accessible description everywhere. */}
        <ul aria-label="Viewixsoft CMS features" className="mt-16 grid grid-cols-2 gap-3 sm:sr-only">
          {CMS_FEATURES.map((f) => (
            <li key={f.label} className="flex items-center gap-2.5 text-sm text-ink-300">
              <f.icon aria-hidden="true" className="size-4 shrink-0 text-signal-400" />
              {f.label}
            </li>
          ))}
        </ul>
      </div>
    </LazyMotion>
  )
}

/** A circle centered on the hub; only its upper half shows inside the box. */
function Arc({ sizePct }: { sizePct: number }) {
  return (
    <div
      className="absolute top-[80%] left-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink-800 bg-[radial-gradient(circle_at_50%_0%,var(--color-signal-950),transparent_70%)]"
      style={{ width: `${sizePct * 0.8}%` }}
    />
  )
}

function Orbit({
  items,
  sizePct,
  seconds,
  reduce,
}: {
  items: OrbitItem[]
  sizePct: number
  seconds: number
  reduce: boolean
}) {
  const step = 360 / items.length

  return (
    <m.div
      className="absolute top-[80%] left-1/2 aspect-square"
      style={{ width: `${sizePct * 0.8}%`, x: '-50%', y: '-50%' }}
      animate={reduce ? undefined : { rotate: 360 }}
      transition={{ duration: seconds, ease: 'linear', repeat: Infinity }}
    >
      {items.map((item, i) => {
        // Offset so the first copy fans across the top half on load.
        const angle = i * step - 72
        return (
          <div key={`${item.label}-${i}`} className="absolute inset-0" style={{ transform: `rotate(${angle}deg)` }}>
            <m.div
              className="absolute top-0 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
              initial={{ rotate: -angle }}
              animate={reduce ? undefined : { rotate: -angle - 360 }}
              transition={{ duration: seconds, ease: 'linear', repeat: Infinity }}
            >
              <span className="flex size-12 items-center justify-center rounded-full border border-ink-700 bg-ink-950 text-signal-400 shadow-md">
                <item.icon className="size-5" />
              </span>
              <span className="hidden font-mono text-[10px] tracking-[0.12em] whitespace-nowrap text-ink-400 uppercase sm:block">
                {item.label}
              </span>
            </m.div>
          </div>
        )
      })}
    </m.div>
  )
}
