import type { ReactNode } from 'react'
import { cn } from '~/lib/cn'

type LedState = 'on' | 'standby' | 'alert'

interface ScreenProps {
  children?: ReactNode
  /** Mono caption under the bezel, e.g. "NODE_US_NYC_042". */
  label?: string
  led?: LedState
  className?: string
  /** Inner display classes (background, aspect). */
  displayClassName?: string
  bare?: boolean
}

const LED_CLASS: Record<LedState, string> = {
  on: 'bg-signal-400',
  standby: 'bg-alert animate-led',
  alert: 'bg-alert animate-led',
}

/**
 * The story's main character: a commercial display with a hardware bezel,
 * broadcast safe-area marks and faint CRT scanlines. Purely decorative.
 */
export function Screen({ children, label, led = 'on', className, displayClassName, bare = false }: ScreenProps) {
  return (
    <div className={cn('screen-dark flex flex-col', className)}>
      <div className={cn('relative flex-1 rounded-lg border border-ink-700 bg-ink-850', bare ? 'p-0.5' : 'p-2 sm:p-3')}>
        <div className={cn('relative h-full w-full overflow-hidden rounded-sm bg-ink-950', displayClassName)}>
          {children}
          {!bare && <div className="safe-marks pointer-events-none absolute inset-3" />}
          <div className="scanlines pointer-events-none absolute inset-0" />
        </div>
        {!bare && <span className={cn('absolute bottom-1 right-3 h-1 w-1 rounded-full', LED_CLASS[led])} />}
      </div>
      {label && (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-500">{label}</p>
      )}
    </div>
  )
}

/** SMPTE-style color bars, used for the boot flash and for broken screens. */
export function TestBars({ className }: { className?: string }) {
  const bars = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0']
  return (
    <div className={cn('absolute inset-0 flex flex-col', className)}>
      <div className="flex flex-[3]">
        {bars.map((c) => (
          // SMPTE bars are a fixed broadcast standard, not theme colors.
          <span key={c} className="flex-1" style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="flex flex-1">
        {[...bars].reverse().map((c, i) => (
          <span key={c} className="flex-1" style={{ backgroundColor: i % 2 ? '#131313' : c }} />
        ))}
      </div>
    </div>
  )
}
