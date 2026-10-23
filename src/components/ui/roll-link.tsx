import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

// One easing for the roll and the arrow, so they move as one.
const motion = 'transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] motion-reduce:transition-none'

/**
 * Pill link whose label rolls up to a copy of itself and whose arrow turns
 * level on hover or keyboard focus. Only transforms animate.
 */
export function RollLink({ to, children }: { to: LinkProps['to']; children: string }) {
  return (
    <Link
      to={to}
      preload="intent"
      className="group bg-brand-gradient inline-flex items-center gap-3 rounded-full py-2 pr-2 pl-6 text-sm font-semibold text-on-gradient"
    >
      <span className="h-5 overflow-hidden">
        <span className={`flex flex-col ${motion} group-hover:-translate-y-1/2 group-focus-visible:-translate-y-1/2`}>
          <span className="flex h-5 items-center">{children}</span>
          {/* The copy that rolls in; read once by screen readers. */}
          <span aria-hidden="true" className="flex h-5 items-center">
            {children}
          </span>
        </span>
      </span>
      <span className="flex size-8 items-center justify-center rounded-full bg-ink-950">
        <ArrowRight
          aria-hidden="true"
          className={`size-3.5 -rotate-45 text-signal-600 ${motion} group-hover:rotate-0 group-focus-visible:rotate-0`}
        />
      </span>
    </Link>
  )
}
