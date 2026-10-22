import { m, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { MousePointer2, Film } from 'lucide-react'

const RULER = ['06', '08', '10', '12', '14', '16', '18', '20', '22']
const DAY_START = 6
const DAY_HOURS = 16

/** Percent position of an hour on the 06:00–22:00 ruler. */
const at = (hour: number) => ((hour - DAY_START) / DAY_HOURS) * 100

function formatClock(hour: number) {
  const h = Math.floor(hour)
  const m = Math.round((hour - h) * 60) % 60
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`
}

const TRACKS = [
  { name: 'Zone A · Video', clips: [{ from: 6.5, to: 8 }, { from: 20, to: 21.5 }] },
  { name: 'Zone B · Ticker', clips: [{ from: 7, to: 13 }, { from: 14, to: 21 }] },
  { name: 'Zone C · Weather', clips: [{ from: 6, to: 22 }] },
]

/**
 * The CMS console: a file is dragged onto Zone A, then the playhead sweeps the
 * day from 08:00 AM to 08:00 PM. Progress windows:
 * 0.08–0.4 drag · 0.4–0.48 drop · 0.48–0.68 sweep.
 */
export function TimelineScrubber({ progress }: { progress: MotionValue<number> }) {
  const chipLeft = useTransform(progress, [0.08, 0.4], ['58%', `${at(8)}%`])
  const chipTop = useTransform(progress, [0.08, 0.4], ['-160%', '0%'])
  const chipOpacity = useTransform(progress, [0.02, 0.08, 0.42, 0.48], [0, 1, 1, 0])
  const clipScale = useTransform(progress, [0.4, 0.48], [0, 1])
  const hour = useTransform(progress, [0.48, 0.68], [8, 20], { clamp: true })
  const playhead = useTransform(hour, (h) => `${at(h)}%`)
  const clock = useTransform(hour, formatClock)

  return (
    <div className="flex h-full flex-col rounded-lg border border-ink-800 bg-ink-900 p-3 font-mono text-[10px] text-ink-400 sm:p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="uppercase tracking-[0.14em]">Schedule · All screens</span>
        <m.span className="rounded-sm border border-ink-700 px-2 py-0.5 text-ink-50">{clock}</m.span>
      </div>

      <div className="relative flex-1">
        <div className="ml-[calc(28%+0.5rem)] flex justify-between border-b border-ink-800 pb-1 text-[9px] text-ink-500">
          {RULER.map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>

        <div className="mt-1.5 space-y-1.5">
          {TRACKS.map((track, ti) => (
            <div key={track.name} className="flex items-center gap-2">
              <span className="w-[28%] shrink-0 truncate pr-1 text-[9px] uppercase tracking-wider">{track.name}</span>
              <div className="relative h-4 flex-1 rounded-[2px] bg-ink-950 sm:h-5">
                {track.clips.map((c) => (
                  <span
                    key={c.from}
                    className="absolute inset-y-0.5 rounded-[2px] bg-ink-700"
                    style={{ left: `${at(c.from)}%`, width: `${at(c.to) - at(c.from)}%` }}
                  />
                ))}
                {ti === 0 && (
                  <>
                    <m.span
                      className="absolute inset-y-0.5 origin-left rounded-[2px] bg-light-cms"
                      style={{ left: `${at(8)}%`, width: `${at(20) - at(8)}%`, scaleX: clipScale }}
                    />
                    <m.span
                      className="absolute z-10 flex items-center gap-1 whitespace-nowrap rounded-sm border border-light-cms bg-ink-950 px-1.5 py-0.5 text-[9px] text-light-cms"
                      style={{ left: chipLeft, top: chipTop, opacity: chipOpacity }}
                    >
                      <Film className="h-3 w-3" />
                      Summer Promo_4K.mp4
                      <MousePointer2 className="absolute -bottom-3 -right-2 h-4 w-4 fill-ink-50 text-ink-950" />
                    </m.span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-[28%] right-0 ml-2">
          <m.span className="absolute inset-y-0 w-px bg-signal-400" style={{ left: playhead }} />
        </div>
      </div>
    </div>
  )
}
