import { useImperativeHandle, useRef, useState } from 'react'
import type { Ref } from 'react'
import { Play } from 'lucide-react'
import type { IntroVideoContent, SectionVideo } from '~/lib/section-content'

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

function VideoPlayer({ tour, video, ref }: { tour: IntroVideoContent; video: SectionVideo; ref?: Ref<ProductTourHandle> }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [started, setStarted] = useState(false)
  const start = () => {
    setStarted(true)
    void videoRef.current?.play()
  }
  useImperativeHandle(ref, () => ({ play: start }), [])

  return (
    <div className="relative aspect-video bg-ink-900">
      {/* preload="none": no video bytes load until the visitor presses play. */}
      <video
        ref={videoRef}
        src={video.url}
        poster={tour.poster?.url}
        preload="none"
        playsInline
        controls={started}
        width={video.width}
        height={video.height}
        className="size-full object-cover"
      >
        {tour.captions && <track kind="captions" src={tour.captions.url} srcLang="en" label="English" default />}
      </video>

      {!started && (
        <button
          type="button"
          onClick={start}
          aria-label={`Play video: ${tour.title}`}
          className="group absolute inset-0 flex items-center justify-center bg-ink-950/10"
        >
          <span className="flex size-20 items-center justify-center rounded-full bg-ink-50 text-ink-950 shadow-xl transition-transform group-hover:scale-105 motion-reduce:transition-none sm:size-28">
            <Play aria-hidden="true" className="ml-1 size-8 fill-current sm:size-10" />
          </span>
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
