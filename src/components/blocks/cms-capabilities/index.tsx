import { useId, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import type { ComponentType } from 'react'
import { SectionHeading } from '~/components/blocks/SectionHeading'
import { Reveal } from '~/components/ui/reveal'
import { cn } from '~/lib/cn'
import { useSectionContent } from '~/lib/use-section-content'
import { CMS_APP_URL } from '~/data/app-links'
import {
  IsoDefs,
  SceneCloudMedia,
  SceneDeviceReport,
  SceneRemotePublish,
  SceneSchedule,
  SceneSyncedWall,
} from './iso-scenes'

/** Full product tour on the Viewix display site. */
const FEATURE_TOUR_URL = CMS_APP_URL

// One illustration per capability, in order; the text comes from /admin/pages.
const SCENES: ComponentType[] = [SceneCloudMedia, SceneRemotePublish, SceneSchedule, SceneSyncedWall, SceneDeviceReport]

export function CmsCapabilitiesSection() {
  const { eyebrow, title, highlight, description, items } = useSectionContent('product-cms:capabilities')
  const capabilities = items.map((item, i) => ({ ...item, Scene: SCENES[i] ?? SceneCloudMedia }))
  const [active, setActive] = useState(0)
  const baseId = useId()

  return (
    <section aria-labelledby="cms-capabilities-title">
      <SectionHeading
        id="cms-capabilities-title"
        eyebrow={eyebrow}
        title={
          <>
            {title}
            {highlight && (
              <>
                {' '}
                <span className="text-ink-500">{highlight}</span>
              </>
            )}
          </>
        }
        description={description}
      />

      <Reveal delay={120} className="mt-12 grid overflow-hidden rounded-3xl border border-ink-800 lg:grid-cols-12">
        <div className="order-2 border-t border-ink-800 lg:order-1 lg:col-span-5 lg:border-t-0 lg:border-r">
          {capabilities.map((c, i) => {
            const open = i === active
            const panelId = `${baseId}-panel-${i}`
            return (
              <div key={c.id} className="relative border-b border-ink-800 last:border-b-0">
                <h3>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setActive(i)}
                    className={cn(
                      'w-full px-6 pt-6 text-left font-display text-lg font-semibold transition-colors sm:px-8 sm:text-xl',
                      open ? 'text-ink-50' : 'pb-6 text-ink-500 hover:text-ink-200',
                    )}
                  >
                    {c.title}
                  </button>
                </h3>
                {/* Every description ships in the SSR HTML; closed ones are just hidden. */}
                <p
                  id={panelId}
                  hidden={!open}
                  className="px-6 pt-2 pb-6 text-pretty text-ink-400 sm:px-8"
                >
                  {c.body}
                </p>
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute inset-x-0 bottom-0 h-0.5 origin-left bg-brand-gradient transition-transform duration-(--duration-slow) ease-(--ease-broadcast)',
                    open ? 'scale-x-100' : 'scale-x-0',
                  )}
                />
              </div>
            )
          })}
        </div>

        <div className="order-1 bg-ink-900 p-6 sm:p-10 lg:order-2 lg:col-span-7">
          <div className="safe-marks relative mx-auto aspect-4/3 w-full max-w-xl">
            {/* Decorative: the text list on the left carries the meaning. */}
            <svg viewBox="0 0 400 300" aria-hidden="true" className="absolute inset-0 size-full">
              <IsoDefs />
              {capabilities.map(({ id, Scene }, i) => (
                <g
                  key={id}
                  className={cn(
                    'transition-opacity duration-(--duration-slow) ease-(--ease-broadcast)',
                    i === active ? 'opacity-100' : 'opacity-0',
                  )}
                >
                  <Scene />
                </g>
              ))}
            </svg>
          </div>
        </div>
      </Reveal>

      <Reveal delay={150} className="mt-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-ink-400">Want to see everything Viewixsoft CMS can do?</p>
        <a
          href={FEATURE_TOUR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-signal-400 hover:text-signal-300"
        >
          See every Viewixsoft CMS feature
          <ArrowUpRight aria-hidden="true" className="size-4" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </Reveal>
    </section>
  )
}
