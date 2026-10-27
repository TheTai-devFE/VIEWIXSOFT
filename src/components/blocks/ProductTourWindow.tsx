import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { Ref } from 'react'
import { Play } from 'lucide-react'
import type { IntroVideoContent, SectionVideo } from '~/lib/section-content'
import { cn } from '~/lib/cn'

export interface ProductTourHandle {
  /** Starts the video, e.g. from the hero's "Watch preview" button. */
  play: () => void
}

/**
 * The Viewixsoft CMS product tour in a browser-window frame, uploaded in
 * /admin/media and picked in /admin/pages. A labelled stand-in shows in the
 * dev server until there is a video.
 */
export function ProductTourWindow({ tour, ref }: { tour: IntroVideoContent; ref?: Ref<ProductTourHandle> }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-950 shadow-2xl">
      {/* Window bar: decoration only. */}
      <div aria-hidden="true" className="flex h-10 items-center gap-2 border-b border-ink-800 bg-ink-900 px-4">
        <span className="size-3 rounded-full bg-destructive/80" />
        <span className="size-3 rounded-full bg-warning/80" />
        <span className="size-3 rounded-full bg-success/80" />
      </div>
      {tour.video ? <VideoPlayer tour={tour} video={tour.video} ref={ref} /> : <VideoPlaceholder />}
    </div>
  )
}

// Share of the player that must be on screen for it to play.
const AUTOPLAY_VISIBLE_RATIO = 0.5

function VideoPlayer({ tour, video, ref }: { tour: IntroVideoContent; video: SectionVideo; ref?: Ref<ProductTourHandle> }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  // idle: poster and play button. auto: playing muted on its own, no browser
  // controls. manual: the visitor pressed play, so sound and controls are on.
  const [mode, setMode] = useState<'idle' | 'auto' | 'manual'>('idle')
  // Set while this code pauses the video, so only the visitor's own pause counts.
  const autoPausing = useRef(false)
  // Once the visitor pauses, scrolling back must not restart the video.
  const userPaused = useRef(false)

  const start = () => {
    const el = videoRef.current
    if (!el) return
    // An explicit play is a user gesture, so the tour can play with sound.
    el.muted = false
    userPaused.current = false
    setMode('manual')
    void el.play()
  }
  useImperativeHandle(ref, () => ({ play: start }), [])

  // Plays (muted, as browsers require for autoplay) while the player is on
  // screen and pauses once it scrolls away. Off under reduced motion.
  useEffect(() => {
    const el = videoRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const onPause = () => {
      if (!autoPausing.current) userPaused.current = true
      autoPausing.current = false
    }
    el.addEventListener('pause', onPause)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (entry.intersectionRatio >= AUTOPLAY_VISIBLE_RATIO) {
          if (userPaused.current || !el.paused) return
          if (mode !== 'manual') el.muted = true
          const resumed = () => setMode((m) => (m === 'manual' ? m : 'auto'))
          el.play().then(resumed, () => {
            if (el.muted) return // Autoplay refused (e.g. battery saver); the play button stays.
            // Sound needs a fresh gesture in some browsers; carry on muted instead.
            el.muted = true
            el.play().then(resumed, () => undefined)
          })
        } else if (!el.paused) {
          autoPausing.current = true
          el.pause()
        }
      },
      { threshold: [0, AUTOPLAY_VISIBLE_RATIO] },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      el.removeEventListener('pause', onPause)
    }
  }, [mode])

  return (
    <div className="relative aspect-video bg-ink-900">
      {/* preload="none": no video bytes load until the player plays (on screen, or on press). */}
      <video
        ref={videoRef}
        src={video.url}
        poster={tour.poster?.url}
        preload="none"
        muted
        playsInline
        controls={mode === 'manual'}
        width={video.width}
        height={video.height}
        className="size-full object-cover"
      >
        {tour.captions && <track kind="captions" src={tour.captions.url} srcLang="en" label="English" default />}
      </video>

      {/* While it plays on its own the whole frame is the button: a press turns
          on sound and brings up the controls (pause, seek, volume). */}
      {mode !== 'manual' && (
        <button
          type="button"
          onClick={start}
          aria-label={mode === 'auto' ? `Play video with sound: ${tour.title}` : `Play video: ${tour.title}`}
          className={cn('group absolute inset-0 flex items-center justify-center', mode === 'idle' && 'bg-ink-950/10')}
        >
          {mode === 'idle' && (
            <span className="flex size-20 items-center justify-center rounded-full bg-ink-50 text-ink-950 shadow-xl transition-transform group-hover:scale-105 motion-reduce:transition-none sm:size-28">
              <Play aria-hidden="true" className="ml-1 size-8 fill-current sm:size-10" />
            </span>
          )}
        </button>
      )}
    </div>
  )
}

function VideoPlaceholder() {
  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-ink-900 text-center">
      <Play aria-hidden="true" className="size-10 text-ink-600" />
      <p className="px-6 font-mono text-xs text-ink-500">
        Product video goes here — upload it in /admin/media, then pick it in /admin/pages → Viewixsoft CMS → Product tour
      </p>
    </div>
  )
}
