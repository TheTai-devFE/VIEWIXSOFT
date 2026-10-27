import type { ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { Reveal } from '~/components/ui/reveal'

/** Corner crosshair of the framed band; centred on the frame's corner. */
function CornerMark({ className }: { className: string }) {
  return <Plus aria-hidden="true" strokeWidth={1.25} className={`absolute size-6 text-ink-500 ${className}`} />
}

/**
 * The drafting-sheet frame shared by the home newsletter band and the
 * "Partner with us" band: guide lines past the edges, corner marks, a soft
 * glow and a dashed centre line. Content is centred inside.
 */
export function FramedBand({ children }: { children: ReactNode }) {
  return (
    <Reveal className="relative">
      {/* Guide lines run past the frame, like a drafting sheet. */}
      <span aria-hidden="true" className="absolute inset-x-0 -top-px h-px bg-ink-800 sm:-inset-x-6" />
      <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-px bg-ink-800 sm:-inset-x-6" />
      <span aria-hidden="true" className="absolute inset-y-0 -left-px w-px bg-ink-800 sm:-inset-y-6" />
      <span aria-hidden="true" className="absolute inset-y-0 -right-px w-px bg-ink-800 sm:-inset-y-6" />
      <CornerMark className="-top-3 -left-3" />
      <CornerMark className="-top-3 -right-3" />
      <CornerMark className="-bottom-3 -left-3" />
      <CornerMark className="-right-3 -bottom-3" />

      <div className="relative overflow-hidden px-6 py-12 text-center sm:px-12 sm:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-1/2 -left-1/4 h-full w-3/4 rounded-full bg-[radial-gradient(closest-side,var(--color-ink-800),transparent)] opacity-80 blur-2xl"
        />
        <span aria-hidden="true" className="absolute inset-y-0 left-1/2 border-l border-dashed border-ink-800" />
        {children}
      </div>
    </Reveal>
  )
}
