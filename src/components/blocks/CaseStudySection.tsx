import type { ReactNode } from 'react'
import { cn } from '~/lib/cn'

/**
 * One block of a case study page: label, question-style H2 and the direct
 * answer that opens it (answer-first), then the block's own content.
 * Left-aligned so the page reads like an article.
 */
export function CaseStudySection({
  id,
  eyebrow,
  title,
  answer,
  children,
  className,
}: {
  id: string
  eyebrow: string
  title: string
  answer?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className={cn('scroll-mt-24 space-y-6', className)}>
      <div className="max-w-3xl space-y-3">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={`${id}-heading`} className="font-display text-2xl font-bold tracking-tight text-balance text-ink-50 sm:text-3xl">
          {title}
        </h2>
        {answer && <p className="text-pretty text-lg leading-relaxed text-ink-300">{answer}</p>}
      </div>
      {children}
    </section>
  )
}
