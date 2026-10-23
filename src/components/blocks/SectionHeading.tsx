import type { ReactNode } from 'react'
import { Reveal } from '~/components/ui/reveal'
import { cn } from '~/lib/cn'

/**
 * A section's label, H2 and intro, centred. Every section on a page uses it
 * so headings line up; `id` is what the section's aria-labelledby points to.
 */
export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  className,
}: {
  id: string
  eyebrow?: string
  title: ReactNode
  description?: string
  className?: string
}) {
  return (
    <Reveal className={cn('mx-auto max-w-3xl text-center', className)}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2
        id={id}
        className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance text-ink-50 sm:text-4xl"
      >
        {title}
      </h2>
      {description && <p className="mx-auto mt-4 max-w-2xl text-pretty text-ink-400">{description}</p>}
    </Reveal>
  )
}
