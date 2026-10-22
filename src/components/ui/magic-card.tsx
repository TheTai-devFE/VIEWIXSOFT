import type { ReactNode } from 'react'
import { useCallback, useEffect } from 'react'
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'motion/react'
import { cn } from '~/lib/cn'

/**
 * Magic UI "Magic Card" (gradient mode): a border and spotlight that follow
 * the pointer. Adapted for this project: no next-themes dependency, colours
 * come from the design tokens so it follows the light/dark theme, and the
 * effect is skipped when the visitor prefers reduced motion.
 */
interface MagicCardProps {
  children?: ReactNode
  className?: string
  gradientSize?: number
  /** Spotlight colour inside the card. */
  gradientColor?: string
  gradientOpacity?: number
  /** Border highlight colours. */
  gradientFrom?: string
  gradientTo?: string
}

export function MagicCard({
  children,
  className,
  gradientSize = 200,
  gradientColor = 'var(--color-signal-950)',
  gradientOpacity = 0.6,
  gradientFrom = 'var(--color-gradient-from)',
  gradientTo = 'var(--color-gradient-to)',
}: MagicCardProps) {
  const reduce = useReducedMotion() ?? false
  const mouseX = useMotionValue(-gradientSize)
  const mouseY = useMotionValue(-gradientSize)

  const reset = useCallback(() => {
    mouseX.set(-gradientSize)
    mouseY.set(-gradientSize)
  }, [gradientSize, mouseX, mouseY])

  useEffect(() => {
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) reset()
    }
    window.addEventListener('pointerout', onOut)
    window.addEventListener('blur', reset)
    return () => {
      window.removeEventListener('pointerout', onOut)
      window.removeEventListener('blur', reset)
    }
  }, [reset])

  const border = useMotionTemplate`
    linear-gradient(var(--surface-panel) 0 0) padding-box,
    radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientFrom}, ${gradientTo}, var(--line) 100%) border-box
  `
  const spotlight = useMotionTemplate`radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientColor}, transparent 100%)`

  return (
    <motion.div
      className={cn('group relative isolate overflow-hidden rounded-2xl border border-transparent', className)}
      onPointerMove={(e) => {
        if (reduce) return
        const rect = e.currentTarget.getBoundingClientRect()
        mouseX.set(e.clientX - rect.left)
        mouseY.set(e.clientY - rect.top)
      }}
      onPointerLeave={reset}
      style={{ background: reduce ? undefined : border }}
    >
      <div className="absolute inset-px z-20 rounded-[inherit] bg-card" />
      {!reduce && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-px z-30 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: spotlight, opacity: gradientOpacity }}
        />
      )}
      <div className="relative z-40">{children}</div>
    </motion.div>
  )
}
