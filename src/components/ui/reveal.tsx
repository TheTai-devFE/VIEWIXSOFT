import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '~/lib/cn'

export type RevealVariant = 'up' | 'fade' | 'scale' | 'left' | 'right'

// Full class strings so Tailwind can see them.
const HIDDEN: Record<RevealVariant, string> = {
  up: 'data-[reveal=hidden]:translate-y-6',
  fade: '',
  scale: 'data-[reveal=hidden]:scale-95',
  left: 'data-[reveal=hidden]:-translate-x-8',
  right: 'data-[reveal=hidden]:translate-x-8',
}

/**
 * Fades its children in when they scroll into view.
 *
 * Content is visible in the SSR HTML and stays visible without JavaScript: only
 * elements that start below the fold are hidden, and only after hydration, so
 * nothing above the fold flashes and crawlers always see the text. Animates
 * transform and opacity only, and does nothing under prefers-reduced-motion.
 */
export function Reveal({
  children,
  variant = 'up',
  delay = 0,
  className,
}: {
  children: ReactNode
  variant?: RevealVariant
  /** Milliseconds; use small steps (60–120) to stagger siblings. */
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'idle' | 'hidden' | 'shown'>('idle')

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // The observer's first callback reports where the element sits, so there is
    // no getBoundingClientRect() here: reading layout during hydration forced a
    // reflow for every Reveal on the page.
    let first = true
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (first) {
          first = false
          const rect = entry.boundingClientRect
          // Already on screen: leave it as rendered so nothing flashes.
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            observer.disconnect()
            return
          }
          setState('hidden')
          return
        }
        if (!entry.isIntersecting) return
        setState('shown')
        observer.disconnect()
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      data-reveal={state}
      style={state === 'shown' && delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        'transition-[opacity,transform] duration-(--duration-slow) ease-(--ease-broadcast) data-[reveal=hidden]:opacity-0',
        HIDDEN[variant],
        className,
      )}
    >
      {children}
    </div>
  )
}
