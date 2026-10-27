// Adapted from beUI (beui.dev/components/motion/animated-badge), with the
// status colours taken from the semantic tokens.
import { AlertTriangle, Check, Circle, Info, LoaderCircle, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { EASE_OUT, SPRING_LAYOUT, SPRING_SWAP } from '~/lib/ease'
import { cn } from '~/lib/cn'

export type AnimatedBadgeStatus = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'loading'

const STATUS_CLASS: Record<AnimatedBadgeStatus, string> = {
  neutral: 'border-border bg-card text-muted-foreground',
  info: 'border-signal-500/30 bg-signal-500/10 text-signal-400',
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  danger: 'border-destructive/30 bg-destructive/10 text-destructive',
  loading: 'border-signal-500/30 bg-signal-500/10 text-signal-400',
}

const ICONS: Record<AnimatedBadgeStatus, LucideIcon> = {
  neutral: Circle,
  info: Info,
  success: Check,
  warning: AlertTriangle,
  danger: X,
  loading: LoaderCircle,
}

// A status change rolls: the old icon and label slide up and out while the new ones slide in from below.
const ROLL = {
  initial: { opacity: 0, y: '90%', filter: 'blur(3px)' },
  animate: { opacity: 1, y: '0%', filter: 'blur(0px)', transition: SPRING_SWAP },
  exit: { opacity: 0, y: '-90%', filter: 'blur(3px)', transition: { duration: 0.14, ease: EASE_OUT } },
}

export function AnimatedBadge({
  status = 'neutral',
  size = 'md',
  children,
  className,
}: {
  status?: AnimatedBadgeStatus
  size?: 'sm' | 'md'
  children: ReactNode
  className?: string
}) {
  const reduce = useReducedMotion()
  const Icon = ICONS[status]
  const key = typeof children === 'string' || typeof children === 'number' ? `${status}-${children}` : status

  return (
    <motion.span
      layout={!reduce}
      transition={SPRING_LAYOUT}
      className={cn(
        'relative inline-flex shrink-0 items-center overflow-hidden rounded-full border font-medium whitespace-nowrap tabular-nums transition-colors duration-300',
        size === 'sm' ? 'h-6 gap-1.5 px-2 text-[11px]' : 'h-8 gap-2 px-3 text-xs',
        STATUS_CLASS[status],
        className,
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={key}
          variants={reduce ? undefined : ROLL}
          initial={reduce ? false : 'initial'}
          animate={reduce ? { opacity: 1 } : 'animate'}
          exit={reduce ? { opacity: 0, transition: { duration: 0 } } : 'exit'}
          className="inline-flex items-center gap-[inherit]"
        >
          <Icon aria-hidden="true" className={cn(size === 'sm' ? 'size-3' : 'size-3.5', status === 'loading' && !reduce && 'animate-spin')} />
          {children}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  )
}
