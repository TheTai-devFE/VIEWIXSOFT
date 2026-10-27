import type { CaseStudyMode } from '~/lib/case-study'
import { cn } from '~/lib/cn'

/** Says honestly what a page is: a guide written by Viewixsoft, or a story approved by a customer. */
export function CaseStudyModeBadge({ mode, className }: { mode: CaseStudyMode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-block rounded-full border px-3 py-1 font-mono text-[11px] font-semibold tracking-wide uppercase',
        mode === 'story' ? 'border-success/40 bg-success/10 text-success' : 'border-ink-700 bg-ink-950/80 text-ink-300',
        className,
      )}
    >
      {mode === 'story' ? 'Customer story' : 'Industry guide'}
    </span>
  )
}
