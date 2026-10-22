import { useRef, useState } from 'react'
import { Play } from 'lucide-react'
import { INTRO_VIDEO } from '~/data/intro-video'
import { Reveal } from '~/components/ui/reveal'

export function IntroVideoSection() {
  const hasVideo = INTRO_VIDEO.src !== ''
  // Hidden in production until the video exists; a labelled stand-in in dev.
  if (!hasVideo && !import.meta.env.DEV) return null

  return (
    <section aria-labelledby="intro-video-title" className="border-t border-ink-800 bg-ink-950">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Product tour</p>
          <h2
            id="intro-video-title"
            className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance text-ink-50 sm:text-4xl"
          >
            What does Viewixsoft do?
          </h2>
          <p className="mt-4 text-pretty text-ink-400">
            This short video walks through Viewixsoft CMS, POS, Tracking and NFC, and how they work together to run
            your screens.
          </p>
        </Reveal>

        <Reveal variant="scale" delay={120} className="mt-10">
          {hasVideo ? <VideoPlayer /> : <VideoPlaceholder />}
        </Reveal>
      </div>
    </section>
  )
}

function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [started, setStarted] = useState(false)

  return (
    <div className="relative aspect-video overflow-hidden rounded-3xl border border-ink-800 bg-ink-900">
      {/* preload="none": no video bytes load until the visitor presses play. */}
      <video
        ref={videoRef}
        src={INTRO_VIDEO.src}
        poster={INTRO_VIDEO.poster || undefined}
        preload="none"
        playsInline
        controls={started}
        width={1920}
        height={1080}
        className="size-full object-cover"
      >
        {INTRO_VIDEO.captions && (
          <track kind="captions" src={INTRO_VIDEO.captions} srcLang="en" label="English" default />
        )}
      </video>

      {!started && (
        <button
          type="button"
          onClick={() => {
            setStarted(true)
            void videoRef.current?.play()
          }}
          aria-label={`Play video: ${INTRO_VIDEO.title}`}
          className="group absolute inset-0 flex items-center justify-center bg-ink-950/20"
        >
          <span className="flex size-20 items-center justify-center rounded-full bg-ink-50 text-ink-950 shadow-lg transition-transform group-hover:scale-105 motion-reduce:transition-none sm:size-24">
            <Play aria-hidden="true" className="ml-1 size-8 fill-current" />
          </span>
        </button>
      )}
    </div>
  )
}

function VideoPlaceholder() {
  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-ink-700 bg-ink-900 text-center">
      <Play aria-hidden="true" className="size-10 text-ink-600" />
      <p className="font-mono text-xs text-ink-500">Product video goes here — set src in src/data/intro-video.ts</p>
    </div>
  )
}
