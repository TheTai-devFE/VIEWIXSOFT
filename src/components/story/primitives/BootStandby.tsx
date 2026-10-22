import type { ReactNode } from 'react'
import { cn } from '~/lib/cn'

/** Screen content while powered off: blinking red LED, "no signal". */
export function BootStandby() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
      <span className="animate-led h-2 w-2 rounded-full bg-alert" />
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500 sm:text-xs">No signal · standby</span>
    </div>
  )
}

export function ScrollHint({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className={cn(
        'absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.2em]',
        active ? 'text-signal-400' : 'text-ink-500',
      )}
    >
      {children}
    </span>
  )
}
