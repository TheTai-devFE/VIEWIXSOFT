import { Suspense, lazy, useRef } from 'react'
import type { ReactNode } from 'react'
import { ClientOnly, Link } from '@tanstack/react-router'
import type { MotionValue } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { cn } from '~/lib/cn'
import { usePrefersReducedMotion } from '~/components/story/use-prefers-reduced-motion'

export type StageRenderer = (progress: MotionValue<number>) => ReactNode

const ScrollStage = lazy(() => import('~/components/story/ScrollStage').then((m) => ({ default: m.ScrollStage })))

interface StorySceneProps {
  id: string
  code: string
  kicker: string
  heading: string
  headingLevel?: 'h1' | 'h2'
  answer: string
  /** Extra copy under the answer: channel switcher, CTA… */
  children?: ReactNode
  stage: StageRenderer
  /**
   * Static markup shown before the animated stage loads (and to no-JS users).
   * The hero passes its "standby" frame so the first paint is not empty.
   */
  poster?: ReactNode
  length?: 'short' | 'long'
}

/**
 * One pinned chapter. The section is taller than the viewport; while it scrolls
 * past, the inner frame stays stuck and the scroll position (0 → 1) drives the
 * stage like a playhead. All copy is plain SSR HTML and never animated, so
 * crawlers and no-JS readers get the full text.
 */
export function StoryScene({
  id,
  code,
  kicker,
  heading,
  headingLevel = 'h2',
  answer,
  children,
  stage,
  poster,
  length = 'long',
}: StorySceneProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()
  const Heading = headingLevel
  const headingId = `${id}-title`

  const fallback = poster ?? <StagePlaceholder />
  const renderStage = (frame: 'live' | 'before' | 'after') => (
    <ClientOnly fallback={fallback}>
      <Suspense fallback={fallback}>
        <ScrollStage trackRef={trackRef} stage={stage} frame={frame} />
      </Suspense>
    </ClientOnly>
  )

  const copy = (
    <div className="max-w-xl">
      <p className="eyebrow">
        CH {code} · {kicker}
      </p>
      <Heading
        id={headingId}
        className={cn(
          'mt-3 font-display font-semibold tracking-tight text-ink-50 text-balance',
          headingLevel === 'h1' ? 'text-hero' : 'text-scene',
        )}
      >
        {heading}
      </Heading>
      <p className="mt-4 text-sm leading-relaxed text-ink-300 sm:text-base lg:text-lg">{answer}</p>
      {children && <div className="mt-6 space-y-5">{children}</div>}
    </div>
  )

  return (
    <section id={id} aria-labelledby={headingId} className="relative scroll-mt-16">
      {/*
        Desktop: the whole frame (copy + stage) pins. Mobile: the copy scrolls
        by first, then only the stage pins, so long copy is never clipped.
      */}
      <div
        ref={trackRef}
        className={cn(
          'relative',
          !reduced && (length === 'long' ? 'h-[210svh] lg:h-[240vh]' : 'h-[170svh] lg:h-[180vh]'),
        )}
      >
        <div className={cn('h-full', !reduced && 'lg:sticky lg:top-16 lg:h-[calc(100svh-4rem)] lg:overflow-hidden')}>
          <div
            className={cn(
              'mx-auto flex h-full max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:grid lg:grid-cols-12 lg:items-center lg:gap-12 lg:px-8 xl:pl-20',
              reduced ? 'py-16 lg:py-24' : 'pt-10 lg:py-0',
            )}
          >
            <div className="lg:col-span-5">{copy}</div>

            {reduced ? (
              <div aria-hidden="true" className="grid gap-6 lg:col-span-7">
                <figure className="space-y-2">
                  <div className="aspect-video overflow-hidden">{renderStage('before')}</div>
                  <figcaption className="eyebrow text-ink-400">Before</figcaption>
                </figure>
                <figure className="space-y-2">
                  <div className="aspect-video overflow-hidden">{renderStage('after')}</div>
                  <figcaption className="eyebrow">After</figcaption>
                </figure>
              </div>
            ) : (
              <div aria-hidden="true" className="min-h-0 flex-1 lg:col-span-7">
                <div className="sticky top-20 h-[min(56svh,32rem)] lg:static lg:h-[72vh]">
                  {renderStage('live')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function StagePlaceholder() {
  return <div className="h-full w-full rounded-lg border border-ink-800 bg-ink-900" />
}

/** Text link that closes each chapter ("Explore Viewixsoft CMS →"). */
export function SceneLink({ to, params, children }: { to: string; params?: Record<string, string>; children: ReactNode }) {
  return (
    <Link
      to={to}
      params={params}
      className="group inline-flex items-center gap-2 border-b border-signal-700 pb-1 font-mono text-xs uppercase tracking-[0.14em] text-signal-400 transition-colors hover:border-signal-400 hover:text-signal-300"
    >
      {children}
      <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
