import { Children, memo, useEffect, useMemo, useState } from 'react'
import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { cn } from '~/lib/cn'

/**
 * Magic UI "Animated List": reveals items one by one, newest on top. Pass
 * children oldest first. Adapted: with reduced motion every item shows at once.
 */
function AnimatedListItem({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, originY: 0 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 40 }}
      layout
      className="w-full"
    >
      {children}
    </motion.div>
  )
}

interface AnimatedListProps extends ComponentPropsWithoutRef<'div'> {
  children: ReactNode
  /** Milliseconds between items. */
  delay?: number
}

export const AnimatedList = memo(function AnimatedList({ children, className, delay = 400, ...props }: AnimatedListProps) {
  const reduce = useReducedMotion() ?? false
  const items = useMemo(() => Children.toArray(children), [children])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (reduce || index >= items.length - 1) return
    const t = setTimeout(() => setIndex((i) => i + 1), delay)
    return () => clearTimeout(t)
  }, [index, delay, items.length, reduce])

  const shown = useMemo(() => items.slice(0, reduce ? items.length : index + 1).reverse(), [items, index, reduce])

  return (
    <div className={cn('flex flex-col gap-3', className)} {...props}>
      <AnimatePresence initial={!reduce}>
        {shown.map((item) => (
          <AnimatedListItem key={(item as ReactElement).key}>{item}</AnimatedListItem>
        ))}
      </AnimatePresence>
    </div>
  )
})
