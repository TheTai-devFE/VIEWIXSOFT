import { useCallback, useRef } from 'react'
import { flushSync } from 'react-dom'
import { Moon, Sun } from 'lucide-react'
import { cn } from '~/lib/cn'

/**
 * Magic UI "Animated Theme Toggler" (circle variant): the new theme grows out
 * of the button with the View Transitions API. Adapted: controlled only (the
 * caller owns persistence), no other shapes, and an instant switch when the
 * browser lacks View Transitions or the visitor prefers reduced motion.
 */
interface Props {
  theme: 'light' | 'dark'
  onThemeChange: (theme: 'light' | 'dark') => void
  duration?: number
  className?: string
}

export function AnimatedThemeToggler({ theme, onThemeChange, duration = 400, className }: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  const busy = useRef(false)
  const next = theme === 'dark' ? 'light' : 'dark'

  const toggle = useCallback(() => {
    const button = ref.current
    if (!button || busy.current) return
    const apply = () => onThemeChange(next)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (typeof document.startViewTransition !== 'function' || reduce) {
      apply()
      return
    }

    const { top, left, width, height } = button.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const w = window.innerWidth
    const h = window.innerHeight
    const radius = Math.hypot(Math.max(x, w - x), Math.max(y, h - y))
    // Percentages of the snapshot box (see Magic UI #989 on fractional display scales).
    const at = `${(x / w) * 100}% ${(y / h) * 100}%`
    const r = `${(radius / (Math.hypot(w, h) / Math.SQRT2)) * 100}%`

    busy.current = true
    const transition = document.startViewTransition(() => flushSync(apply))
    void transition.finished.finally(() => {
      busy.current = false
    })
    void transition.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0% at ${at})`, `circle(${r} at ${at})`] },
          { duration, easing: 'ease-in-out', fill: 'forwards', pseudoElement: '::view-transition-new(root)' },
        )
      })
      .catch(() => undefined)
  }, [duration, next, onThemeChange])

  return (
    <button
      ref={ref}
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground [&_svg]:size-4',
        className,
      )}
    >
      {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </button>
  )
}
