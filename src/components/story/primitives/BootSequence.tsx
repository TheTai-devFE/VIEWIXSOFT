import { m, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { Screen, TestBars } from '~/components/story/primitives/Screen'
import { BootStandby, ScrollHint } from '~/components/story/primitives/BootStandby'

function timecode(p: number) {
  const totalFrames = Math.floor(p * 12 * 60)
  const s = Math.floor(totalFrames / 60)
  const f = totalFrames % 60
  return `CH 00 · 00:00:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`
}

/**
 * 0–0.38 standby (scanlines, red LED) · 0.4–0.5 test bars flash ·
 * 0.48+ "SIGNAL LOCK" · 0.55+ on air with running timecode.
 */
export function BootSequence({ progress }: { progress: MotionValue<number> }) {
  const standby = useTransform(progress, [0.32, 0.4], [1, 0])
  const bars = useTransform(progress, [0.4, 0.42, 0.47, 0.5], [0, 1, 1, 0])
  const lock = useTransform(progress, [0.48, 0.52, 0.62, 0.68], [0, 1, 1, 0])
  const onAir = useTransform(progress, [0.55, 0.65], [0, 1])
  const onAirScale = useTransform(progress, [0.55, 0.7], [1.04, 1])
  const tc = useTransform(progress, timecode)
  const hintStart = useTransform(progress, [0, 0.12], [1, 0])
  const hintEnd = useTransform(progress, [0.8, 0.9], [0, 1])

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <Screen className="aspect-video w-full max-h-full">
        <m.div style={{ opacity: standby }} className="absolute inset-0">
          <BootStandby />
        </m.div>

        <m.div style={{ opacity: bars }} className="absolute inset-0">
          <TestBars />
        </m.div>

        <m.div style={{ opacity: lock }} className="absolute inset-0 grid place-items-center">
          <span className="rounded-sm border border-signal-400 bg-ink-950 px-3 py-1.5 font-mono text-xs tracking-[0.16em] text-signal-400 sm:text-sm">
            SIGNAL LOCK: 4K 60FPS
          </span>
        </m.div>

        {/* On air */}
        <m.div style={{ opacity: onAir, scale: onAirScale }} className="absolute inset-0 flex flex-col justify-between bg-ink-900 p-[6%]">
          <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.16em] sm:text-[11px]">
            <span className="flex items-center gap-1.5 text-signal-400">
              <span className="h-1.5 w-1.5 rounded-full bg-signal-400" /> On air
            </span>
            <m.span className="text-ink-400">{tc}</m.span>
          </div>
          <div>
            <p className="font-display text-3xl font-semibold tracking-tight text-ink-50 sm:text-5xl lg:text-6xl">Viewixsoft</p>
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-400 sm:text-xs">
              Direct · Monetize · Monitor
            </p>
          </div>
          <div className="flex gap-1">
            {['bg-light-cms', 'bg-light-pos', 'bg-light-nfc', 'bg-light-tracking'].map((bg) => (
              <span key={bg} className={`h-1 flex-1 ${bg}`} />
            ))}
          </div>
        </m.div>
      </Screen>

      <div className="relative h-4 w-full">
        <m.div style={{ opacity: hintStart }} className="absolute inset-0">
          <ScrollHint>Scroll to power on ↓</ScrollHint>
        </m.div>
        <m.div style={{ opacity: hintEnd }} className="absolute inset-0">
          <ScrollHint active>Scroll to broadcast ↓</ScrollHint>
        </m.div>
      </div>
    </div>
  )
}
