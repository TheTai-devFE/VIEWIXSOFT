import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '~/lib/cn'

interface MarqueeProps extends ComponentPropsWithoutRef<'div'> {
  children: ReactNode
  /** Scroll right instead of left. */
  reverse?: boolean
  /** Pause while the pointer or keyboard focus is inside. */
  pauseOnHover?: boolean
  /** Copies of the content; enough to fill the widest screen without a gap. */
  repeat?: number
}

/**
 * Endless horizontal row, ported from Magic UI's Marquee. Each copy moves by
 * its own width plus the gap, so the loop is seamless. Only the first copy is
 * read by assistive tech. Under prefers-reduced-motion the row stays still and
 * scrolls by hand. Set the speed and spacing with `[--duration:60s]` and `[--gap:1.25rem]`.
 */
export function Marquee({ children, reverse = false, pauseOnHover = false, repeat = 4, className, ...props }: MarqueeProps) {
  return (
    <div
      {...props}
      className={cn(
        'group flex gap-(--gap) overflow-x-auto [--duration:40s] [--gap:1rem] motion-safe:overflow-hidden',
        className,
      )}
    >
      {Array.from({ length: repeat }, (_, i) => (
        <div
          key={i}
          aria-hidden={i > 0 || undefined}
          // Copies are decorative: their links must not take keyboard focus.
          inert={i > 0 || undefined}
          className={cn(
            'flex shrink-0 justify-around gap-(--gap) motion-safe:animate-marquee-copy',
            i > 0 && 'motion-reduce:hidden',
            pauseOnHover && 'group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]',
            reverse && '[animation-direction:reverse]',
          )}
        >
          {children}
        </div>
      ))}
    </div>
  )
}
