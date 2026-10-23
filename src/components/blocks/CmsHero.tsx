import { useRef } from 'react'
import { ArrowRight, Play } from 'lucide-react'
import { ProductTourWindow } from '~/components/blocks/ProductTourWindow'
import type { ProductTourHandle } from '~/components/blocks/ProductTourWindow'
import { Button } from '~/components/ui/button'
import { Reveal } from '~/components/ui/reveal'
import { CMS_APP_URL } from '~/data/app-links'
import type { CmsWhyContent, IntroVideoContent } from '~/lib/section-content'

/**
 * Opening of /products/cms: a centred heading (the page's H1) with a glowing
 * highlight, the calls to action, and the product tour in a browser window.
 * Text comes from /admin/pages (Viewixsoft CMS → Why choose), the video from
 * its Product tour section.
 */
export function CmsHero({ content, tour, showTour }: { content: CmsWhyContent; tour: IntroVideoContent; showTour: boolean }) {
  const player = useRef<ProductTourHandle>(null)
  const windowRef = useRef<HTMLDivElement>(null)
  // The window shows a stand-in in the dev server until a video is picked.
  const showWindow = showTour && (tour.video !== null || import.meta.env.DEV)
  const canPlay = showTour && tour.video !== null

  const watch = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    windowRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
    player.current?.play()
  }

  return (
    <section aria-labelledby="cms-hero-title" className="isolate">
      <div className="mx-auto max-w-4xl text-center">
        {content.eyebrow && <p className="text-base text-ink-400 sm:text-lg">{content.eyebrow}</p>}
        <h1
          id="cms-hero-title"
          className="mt-4 font-display text-5xl font-semibold tracking-tight text-balance text-ink-50 sm:text-7xl"
        >
          {content.title}
          {content.highlight && (
            <>
              {' '}
              <span className="relative inline-block">
                {/* Soft light behind the highlight, like a lit screen; decorative. */}
                <span
                  aria-hidden="true"
                  className="absolute -inset-x-6 inset-y-2 -z-10 rounded-full bg-[linear-gradient(90deg,var(--color-light-cms),var(--color-gradient-via),var(--color-gradient-to))] opacity-35 blur-2xl"
                />
                <span className="text-brand-gradient">{content.highlight}</span>
              </span>
            </>
          )}
        </h1>
        {content.description && (
          <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-ink-400">{content.description}</p>
        )}

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 w-full px-7 text-base sm:w-auto">
            <a href={CMS_APP_URL}>
              Explore Viewixsoft CMS
              <ArrowRight aria-hidden="true" />
            </a>
          </Button>
          {canPlay && (
            <Button type="button" size="lg" variant="outline" onClick={watch} className="h-12 w-full px-7 text-base sm:w-auto">
              <Play aria-hidden="true" />
              Watch preview
            </Button>
          )}
        </div>

        {content.tags.length > 0 && (
          <p className="mt-6 text-sm text-ink-500">{content.tags.map((t) => t.text).join(' · ')}</p>
        )}
      </div>

      {showWindow && (
        <Reveal variant="scale" delay={150} className="relative mx-auto mt-16 max-w-5xl sm:mt-20">
          {/* Colour bleeding out from behind the window; decorative. */}
          <div
            aria-hidden="true"
            className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-[conic-gradient(from_200deg,var(--color-light-tracking),var(--color-light-cms),var(--color-gradient-via),var(--color-gradient-to),var(--color-light-pos),var(--color-light-tracking))] opacity-30 blur-3xl sm:-inset-8"
          />
          <div ref={windowRef}>
            <ProductTourWindow tour={tour} ref={player} />
          </div>
        </Reveal>
      )}
    </section>
  )
}
