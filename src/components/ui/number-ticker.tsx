import { useEffect, useRef } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import { useInView, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { cn } from '~/lib/cn'

/**
 * Port of Magic UI's Number Ticker. Changes from the original:
 * - the real value is always in the SSR HTML (sr-only), so crawlers, AI
 *   assistants and screen readers never read the start value;
 * - reduced motion shows the final value with no count;
 * - colors come from tokens via `className`.
 */
interface NumberTickerProps extends ComponentPropsWithoutRef<'span'> {
  value: number
  startValue?: number
  direction?: 'up' | 'down'
  delay?: number
  decimalPlaces?: number
  suffix?: string
}

function format(n: number, decimalPlaces: number) {
  return Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(Number(n.toFixed(decimalPlaces)))
}

export function NumberTicker({
  value,
  startValue = 0,
  direction = 'up',
  delay = 0,
  decimalPlaces = 0,
  suffix = '',
  className,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion() ?? false
  const from = direction === 'down' ? value : startValue
  const to = direction === 'down' ? startValue : value
  const motionValue = useMotionValue(from)
  const springValue = useSpring(motionValue, { damping: 60, stiffness: 100 })
  const isInView = useInView(ref, { once: true, margin: '0px' })

  useEffect(() => {
    if (reduce) {
      if (ref.current) ref.current.textContent = format(to, decimalPlaces)
      return
    }
    if (!isInView) return
    const timer = setTimeout(() => motionValue.set(to), delay * 1000)
    return () => clearTimeout(timer)
  }, [motionValue, isInView, delay, to, reduce, decimalPlaces])

  useEffect(
    () =>
      springValue.on('change', (latest) => {
        if (ref.current) ref.current.textContent = format(latest, decimalPlaces)
      }),
    [springValue, decimalPlaces],
  )

  return (
    <span className={cn('inline-flex items-baseline tabular-nums', className)} {...props}>
      <span className="sr-only">
        {format(to, decimalPlaces)}
        {suffix}
      </span>
      <span aria-hidden="true" className="inline-flex items-baseline">
        <span ref={ref}>{format(from, decimalPlaces)}</span>
        {suffix}
      </span>
    </span>
  )
}
