import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from 'motion/react'
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  ChartColumn,
  FileCheck,
  Film,
  Gift,
  ImageUp,
  LayoutList,
  Monitor,
  Nfc,
  Receipt,
  ShoppingCart,
  Smartphone,
  TabletSmartphone,
  Tag,
  Tv,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { ViewixLogo } from '~/components/blocks/ViewixLogo'
import { NumberTicker } from '~/components/ui/number-ticker'
import { cn } from '~/lib/cn'
import { Reveal } from '~/components/ui/reveal'
import { METRIC_DEFS } from '~/data/site-sections'
import type { MetricKey } from '~/data/site-sections'
import { SHOW_SAMPLE_CONTENT } from '~/lib/site-config'
import { useSiteConfig } from '~/lib/use-site-config'

interface Pillar {
  slug: 'cms' | 'pos' | 'tracking' | 'nfc'
  // The verb this product owns in the vision: Publish → Sync → Prove → Engage.
  pillar: string
  name: string
  // What flows into Viewixsoft and what comes out, drawn in the window diagram.
  inputs: [LucideIcon, LucideIcon, LucideIcon]
  outputs: [LucideIcon, LucideIcon, LucideIcon]
}

const PILLARS: Pillar[] = [
  {
    slug: 'cms',
    pillar: 'Publish',
    name: 'Viewixsoft CMS',
    inputs: [ImageUp, Film, CalendarClock],
    outputs: [Monitor, Tv, TabletSmartphone],
  },
  {
    slug: 'pos',
    pillar: 'Sync',
    name: 'Viewixsoft POS',
    inputs: [ShoppingCart, Receipt, Tag],
    outputs: [LayoutList, Monitor, Tv],
  },
  {
    slug: 'tracking',
    pillar: 'Prove',
    name: 'Viewixsoft Tracking',
    inputs: [Monitor, Tv, TabletSmartphone],
    outputs: [Activity, FileCheck, ChartColumn],
  },
  {
    slug: 'nfc',
    pillar: 'Engage',
    name: 'Viewixsoft NFC',
    inputs: [Smartphone, Nfc, Monitor],
    outputs: [Gift, BadgeCheck, ChartColumn],
  },
]

// Made-up figures for design review only: they render in the dev server, never
// in production. Real values are entered in /admin/site with a source and date.
const SAMPLE_VALUES: Record<MetricKey, number> = { customers: 50, devices: 1200, plays: 250_000 }

/** Large counts read better compacted: 250,000 → 250 with a "K+" suffix. */
function display(value: number, suffix: string) {
  return value >= 10_000 ? { value: Math.round(value / 1000), suffix: `K${suffix}` } : { value, suffix }
}

function useStats() {
  const config = useSiteConfig()
  const real = METRIC_DEFS.map((def) => ({ def, metric: config.metrics.find((m) => m.key === def.key) }))
  if (real.every((r) => r.metric)) {
    const asOf = real.reduce((latest, r) => ((r.metric?.asOf ?? '') > latest ? (r.metric?.asOf ?? '') : latest), '')
    const sources = [...new Set(real.map((r) => r.metric?.source ?? ''))].filter(Boolean)
    return {
      items: real.map((r) => ({ label: r.def.label, ...display(r.metric?.value ?? 0, r.def.suffix) })),
      note: `Figures as of ${asOf}. Source: ${sources.join('; ')}.`,
    }
  }
  if (!SHOW_SAMPLE_CONTENT) return null
  return {
    items: METRIC_DEFS.map((def) => ({ label: def.label, ...display(SAMPLE_VALUES[def.key], def.suffix) })),
    note: 'Sample figures (dev only). Enter real ones in /admin/site.',
  }
}

const AUTO_ADVANCE_MS = 5000

export function SolutionsSection({ id }: { id?: string }) {
  const reduce = useReducedMotion() ?? false
  const [active, setActive] = useState(0)

  // The diagram cycles through the four pillars on its own.
  useEffect(() => {
    if (reduce) return
    const t = window.setInterval(() => setActive((i) => (i + 1) % PILLARS.length), AUTO_ADVANCE_MS)
    return () => window.clearInterval(t)
  }, [reduce])

  const stats = useStats()
  const current = PILLARS[active] ?? PILLARS[0]
  if (!current) return null

  return (
    <section id={id} aria-labelledby="solutions-title" className="scroll-mt-16 border-t border-ink-800 bg-ink-900">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28 xl:pl-20">
        <Reveal>
          <p className="eyebrow">Our vision</p>
          <h2
            id="solutions-title"
            className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance text-ink-50 sm:text-5xl"
          >
            Easy to use. <span className="text-brand-gradient">Managed from anywhere.</span>
          </h2>
          {/* TODO(content): vision statement drafted from the product brief; confirm wording with the founders. */}
          <p className="mt-6 max-w-xl text-lg text-pretty text-ink-400">
            Viewixsoft builds digital signage software that helps businesses get the full value from their
            advertising screens. Beyond playing content, every screen becomes a source of anonymous audience insights,
            such as taps, plays and campaign performance, that you can use to plan better ad campaigns.
          </p>

          {/* Hidden in production until all figures are entered with a source and date. */}
          {stats && (
            <dl className="mt-10 grid gap-x-6 gap-y-8 border-t border-ink-800 pt-8 sm:grid-cols-3">
              {stats.items.map(({ label, value, suffix }) => (
                <div key={label} className="flex flex-col">
                  <dt className="order-2 mt-2 text-sm font-medium text-ink-400">{label}</dt>
                  <dd className="order-1">
                    <NumberTicker
                      value={value}
                      suffix={suffix}
                      className="font-display text-4xl font-semibold tracking-tight text-ink-50 sm:text-5xl"
                    />
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {stats && <p className="mt-4 text-xs text-ink-500">{stats.note}</p>}

          <Link
            to="/products"
            preload="intent"
            className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-signal-400 hover:text-signal-300"
          >
            Explore all Viewixsoft products
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Reveal>

        <Reveal variant="fade" delay={150}>
          <IsometricStack pillar={current} reduce={reduce} />
        </Reveal>
      </div>
    </section>
  )
}

/** Stacked app windows in an isometric skew; the front one shows the active pillar's flow. */
function IsometricStack({ pillar, reduce }: { pillar: Pillar; reduce: boolean }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <div aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-[30rem]">
        {/* Dot field the windows float above. */}
        <div className="absolute inset-0 bg-[radial-gradient(var(--color-ink-700)_1px,transparent_1px)] [background-size:1rem_1rem] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />

        <div className="absolute inset-x-[6%] top-[22%] bottom-[14%]">
          {[3, 2, 1].map((depth) => (
            <div
              key={depth}
              className="absolute inset-0"
              style={{ transform: `translate(${depth * 9}%, ${depth * -7}%)`, opacity: 1 - depth * 0.25 }}
            >
              <Window className="h-[78%] w-[72%]" />
            </div>
          ))}

          <div className="absolute inset-0">
            <Window className="h-[78%] w-[72%]" front title={`${pillar.pillar} · ${pillar.name}`}>
              <AnimatePresence mode="wait" initial={false}>
                <m.div
                  key={pillar.slug}
                  className="absolute inset-0"
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduce ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <FlowDiagram pillar={pillar} />
                </m.div>
              </AnimatePresence>
            </Window>
          </div>
        </div>
      </div>
    </LazyMotion>
  )
}

function Window({
  className,
  front = false,
  title,
  children,
}: {
  className?: string
  front?: boolean
  title?: string
  children?: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-ink-700 bg-ink-950 [transform:skewY(24deg)]',
        // A heavy right edge reads as the window's thickness.
        front ? 'border-r-8 border-r-ink-100 shadow-xl' : 'border-r-4',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-ink-800 px-3 py-2">
        <span className="size-2.5 rounded-full border border-ink-600" />
        <span className="size-2.5 rounded-full border border-ink-600" />
        <span className="size-2.5 rounded-full border border-ink-600" />
        {title && (
          <span className="ml-2 truncate font-mono text-[10px] tracking-[0.12em] text-ink-500 uppercase">{title}</span>
        )}
      </div>
      <div className="relative flex-1">{children}</div>
    </div>
  )
}

function FlowDiagram({ pillar }: { pillar: Pillar }) {
  return (
    <div className="absolute inset-0">
      {/* Elbow connectors: inputs → hub → outputs. */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full text-ink-600">
        <g fill="none" stroke="currentColor" strokeDasharray="2 2">
          {[20, 50, 80].map((y) => (
            <path key={`in-${y}`} d={`M22 ${y} H34 V50 H42`} vectorEffect="non-scaling-stroke" />
          ))}
          {[20, 50, 80].map((y) => (
            <path key={`out-${y}`} d={`M58 50 H66 V${y} H78`} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
      </svg>

      <Column icons={pillar.inputs} className="left-[13%]" />
      <span className="absolute top-1/2 left-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl bg-brand-gradient text-on-gradient shadow-lg">
        <ViewixLogo variant="mark" className="size-8" />
      </span>
      <Column icons={pillar.outputs} className="left-[87%]" />
    </div>
  )
}

function Column({ icons, className }: { icons: LucideIcon[]; className?: string }) {
  return (
    <>
      {icons.map((Icon, i) => (
        <span
          key={i}
          className={cn(
            'absolute flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg border border-ink-700 bg-ink-950 text-signal-400 shadow-sm',
            className,
          )}
          style={{ top: `${20 + i * 30}%` }}
        >
          <Icon className="size-4" />
        </span>
      ))}
    </>
  )
}
