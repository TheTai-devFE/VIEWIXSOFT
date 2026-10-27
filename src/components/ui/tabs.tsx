// Adapted from beUI (beui.dev/components/motion/tabs): the segment style with
// a spring layoutId indicator, controlled, without the overflow scroller.
import { motion, MotionConfig, useReducedMotion } from 'motion/react'
import { createContext, useContext, useId } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { SPRING_LAYOUT } from '~/lib/ease'
import { cn } from '~/lib/cn'

const TabsContext = createContext<{ value: string; onValueChange: (value: string) => void; layoutId: string } | null>(null)

function useTabs() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tabs parts must be used inside <Tabs>')
  return ctx
}

export function Tabs({
  value,
  onValueChange,
  children,
  className,
}: {
  value: string
  onValueChange: (value: string) => void
  children: ReactNode
  className?: string
}) {
  const layoutId = useId()
  const reduce = useReducedMotion()
  return (
    <MotionConfig transition={reduce ? { duration: 0 } : SPRING_LAYOUT}>
      <TabsContext.Provider value={{ value, onValueChange, layoutId }}>
        {/* layoutRoot keeps the indicator's glide inside the list when the page scrolls. */}
        <motion.div layoutRoot className={className}>
          {children}
        </motion.div>
      </TabsContext.Provider>
    </MotionConfig>
  )
}

/** Arrow keys move between tabs and select them; Home and End jump to the ends. */
export function TabsList({ children, className, 'aria-label': ariaLabel }: { children: ReactNode; className?: string; 'aria-label': string }) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])'))
    const at = tabs.indexOf(event.target as HTMLButtonElement)
    if (at < 0) return
    const target = {
      ArrowRight: tabs[(at + 1) % tabs.length],
      ArrowLeft: tabs[(at - 1 + tabs.length) % tabs.length],
      Home: tabs[0],
      End: tabs[tabs.length - 1],
    }[event.key]
    if (!target) return
    event.preventDefault()
    target.focus()
    target.click()
  }
  return (
    <div role="tablist" aria-label={ariaLabel} onKeyDown={onKeyDown} className={cn('inline-flex items-center rounded-lg border border-border bg-card p-0.5', className)}>
      {children}
    </div>
  )
}

export function TabsTrigger({ value, icon, children }: { value: string; icon?: ReactNode; children: ReactNode }) {
  const { value: current, onValueChange, layoutId } = useTabs()
  const active = current === value
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      onClick={() => onValueChange(value)}
      className={cn(
        'relative inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold whitespace-nowrap outline-none transition-colors',
        'focus-visible:ring-2 focus-visible:ring-ring',
        active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {active && <motion.span layoutId={layoutId} aria-hidden="true" className="absolute inset-0 rounded-md bg-primary" />}
      <span className="relative z-10 inline-flex items-center gap-1.5">
        {icon}
        {children}
      </span>
    </button>
  )
}
