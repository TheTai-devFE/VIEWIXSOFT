import { m, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { cn } from '~/lib/cn'
import type { CmsChannel } from '~/components/story/story-content'
import { TestBars } from '~/components/story/primitives/Screen'

const COLS = 8
const ROWS = 5
/** The screen from chapter 0 lives at column 3, row 2 of the wall. */
const HERO = { col: 3, row: 2 }
const HERO_INDEX = HERO.row * COLS + HERO.col
const CELLS = Array.from({ length: COLS * ROWS }, (_, i) => i)

type Chaos = 'holiday' | 'no-signal' | 'breakfast' | 'bars' | 'dead' | 'stale-price' | 'spring' | 'frozen'
const CHAOS: Chaos[] = ['holiday', 'no-signal', 'breakfast', 'bars', 'dead', 'stale-price', 'spring', 'frozen']

function chaosFor(i: number): Chaos {
  // Mix row and column so neighbouring screens never repeat in a stripe.
  return CHAOS[(i * 5 + Math.floor(i / COLS) * 3 + 1) % CHAOS.length] ?? 'dead'
}

/** Normalized distance (0 center → 1 corner) used to time the sync wave. */
function distanceFromHero(i: number) {
  const col = i % COLS
  const row = Math.floor(i / COLS)
  const dx = (col - HERO.col) / (COLS - 1)
  const dy = (row - HERO.row) / (ROWS - 1)
  return Math.min(1, Math.hypot(dx, dy) / 0.9)
}

interface ScreenWallProps {
  progress: MotionValue<number>
  /** `multiply`: camera pulls back from one screen to 40 drifting ones. `sync`: a wave aligns them. */
  mode: 'multiply' | 'sync'
  channel?: CmsChannel
  /** Sync wave window inside the scene's progress. */
  syncFrom?: number
  syncTo?: number
}

export function ScreenWall({ progress, mode, channel, syncFrom = 0.62, syncTo = 0.94 }: ScreenWallProps) {
  const zoom = useTransform(progress, [0, 0.2, 0.45, 0.8], [8, 4, 2, 1])
  // Keep the hero cell centered while zoomed: it sits 6.25% left of the wall's center.
  const shift = useTransform(zoom, [8, 1], ['6.25%', '0%'])
  const scale = mode === 'multiply' ? zoom : 1
  const x = mode === 'multiply' ? shift : '0%'

  const driftOpacity = useTransform(progress, [0.72, 0.82], [0, 1])
  const driftOut = useTransform(progress, [syncFrom - 0.04, syncFrom], [1, 0])
  const syncPct = useTransform(progress, [syncFrom, syncTo], [0, 100], { clamp: true })
  const syncLabel = useTransform(syncPct, (v) => `NETWORK SYNC: ${Math.round(v)}% · LATENCY <250MS`)
  const syncOpacity = useTransform(progress, [syncFrom - 0.05, syncFrom], [0, 1])

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg border border-ink-800 bg-ink-950">
      <m.div
        className="grid w-[94%] gap-[0.4%]"
        style={{
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          scale,
          x,
          transformOrigin: `${((HERO.col + 0.5) / COLS) * 100}% ${((HERO.row + 0.5) / ROWS) * 100}%`,
        }}
      >
        {CELLS.map((i) => (
          <WallCell
            key={i}
            index={i}
            progress={progress}
            mode={mode}
            channel={channel}
            syncAt={syncFrom + distanceFromHero(i) * (syncTo - syncFrom - 0.05)}
          />
        ))}
      </m.div>

      {mode === 'multiply' ? (
        <m.p
          style={{ opacity: driftOpacity }}
          className="absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap rounded-sm border border-alert bg-ink-950 px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] text-alert sm:text-xs"
        >
          DRIFT DETECTED: 84% OUT OF SYNC
        </m.p>
      ) : (
        <>
          <m.p
            style={{ opacity: driftOut }}
            className="absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap rounded-sm border border-alert bg-ink-950 px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] text-alert sm:text-xs"
          >
            DRIFT DETECTED: 84% OUT OF SYNC
          </m.p>
          <m.p
            style={{ opacity: syncOpacity }}
            className="absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap rounded-sm border border-signal-500 bg-ink-950 px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] text-signal-400 sm:text-xs"
          >
            <m.span>{syncLabel}</m.span>
          </m.p>
        </>
      )}
    </div>
  )
}

interface WallCellProps {
  index: number
  progress: MotionValue<number>
  mode: 'multiply' | 'sync'
  channel?: CmsChannel
  syncAt: number
}

function WallCell({ index, progress, mode, channel, syncAt }: WallCellProps) {
  const isHero = index === HERO_INDEX
  const synced = useTransform(progress, [syncAt, syncAt + 0.035], [0, 1])
  // In chapter 1 the hero screen starts healthy and breaks once the wall is full.
  const heroBreak = useTransform(progress, [0.7, 0.8], [0, 1])

  return (
    <div className="screen-dark relative aspect-video overflow-hidden rounded-[2px] border border-ink-700 bg-ink-950">
      {isHero && mode === 'multiply' ? (
        <>
          <OnAir />
          <m.div style={{ opacity: heroBreak }} className="absolute inset-0">
            <Glitch />
          </m.div>
        </>
      ) : isHero ? (
        <Glitch />
      ) : (
        <ChaosContent kind={chaosFor(index)} />
      )}

      {mode === 'sync' && channel && (
        <m.div style={{ opacity: synced }} className="absolute inset-0">
          <SyncedContent channel={channel} />
        </m.div>
      )}
      <div className="scanlines pointer-events-none absolute inset-0" />
    </div>
  )
}

const tiny = 'font-mono text-[0.32rem] leading-tight tracking-wide sm:text-[0.4rem]'

function OnAir() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-[6%] bg-ink-900">
      <span className="font-display text-[0.55rem] font-semibold text-ink-50 sm:text-[0.7rem]">Viewixsoft</span>
      <span className={cn(tiny, 'text-signal-400')}>● ON AIR · 4K 60FPS</span>
    </div>
  )
}

function Glitch() {
  return (
    <div className="absolute inset-0 bg-ink-950">
      <TestBars className="animate-glitch opacity-70" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn(tiny, 'bg-ink-950 px-1 text-alert')}>SYNC ERROR</span>
      </div>
    </div>
  )
}

function ChaosContent({ kind }: { kind: Chaos }) {
  switch (kind) {
    case 'holiday':
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900 text-red-100">
          <span className={tiny}>HOLIDAY SALE ❄</span>
          <span className={cn(tiny, 'opacity-70')}>Dec 24 – 26</span>
        </div>
      )
    case 'no-signal':
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink-950 text-ink-400">
          <span className={tiny}>NO SIGNAL</span>
          <span className={cn(tiny, 'text-alert')}>INSERT USB</span>
        </div>
      )
    case 'breakfast':
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-amber-900 text-amber-100">
          <span className={tiny}>BREAKFAST MENU</span>
          <span className={cn(tiny, 'opacity-70')}>now 15:02</span>
        </div>
      )
    case 'bars':
      return <TestBars className="opacity-80" />
    case 'dead':
      return <div className="absolute inset-0 bg-ink-950" />
    case 'stale-price':
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink-800 text-ink-200">
          <span className={tiny}>COMBO</span>
          <span className={cn(tiny, 'text-light-pos')}>$7.99 · old</span>
        </div>
      )
    case 'spring':
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-emerald-900 text-emerald-100">
          <span className={tiny}>SPRING SALE</span>
        </div>
      )
    case 'frozen':
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-ink-700 text-ink-300">
          <span className={tiny}>❚❚ FROZEN</span>
        </div>
      )
  }
}

function SyncedContent({ channel }: { channel: CmsChannel }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-between bg-ink-900 p-[6%]">
      <span className={cn(tiny, 'text-light-cms')}>{channel.label.toUpperCase()}</span>
      <span className="font-display text-[0.42rem] font-semibold uppercase leading-none text-ink-50 sm:text-[0.6rem]">
        {channel.headline}
      </span>
      <span className="h-[3px] w-1/2 bg-light-cms" />
      <span className={cn(tiny, 'truncate text-ink-400')}>{channel.sub}</span>
    </div>
  )
}
