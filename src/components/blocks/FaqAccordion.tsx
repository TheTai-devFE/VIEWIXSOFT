import { useId, useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '~/lib/cn'

export interface FaqItem {
  question: string
  answer: string
}

/**
 * Native <details> accordion: every answer is in the SSR HTML (for search and
 * AI crawlers) and it works by keyboard without JavaScript.
 * Only one question is active/open at a time.
 */
export function FaqAccordion({ items, className }: { items: FaqItem[]; className?: string }) {
  const accordionId = useId()
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className={cn('mx-auto max-w-3xl divide-y divide-ink-800 border-y border-ink-800', className)}>
      {items.map((item, idx) => {
        const isOpen = openIndex === idx
        return (
          <details
            key={item.question}
            name={accordionId}
            className="group"
            open={isOpen}
          >
            <summary
              onClick={(e) => {
                e.preventDefault()
                setOpenIndex(isOpen ? null : idx)
              }}
              className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-base font-semibold text-ink-50 transition-colors hover:text-signal-400 sm:text-lg [&::-webkit-details-marker]:hidden"
            >
              <span>{item.question}</span>
              <Plus
                aria-hidden="true"
                className="h-5 w-5 shrink-0 text-ink-400 transition-transform group-open:rotate-45 group-open:text-signal-400"
              />
            </summary>
            <p className="pb-6 pr-10 text-sm leading-relaxed text-ink-300 sm:text-base">{item.answer}</p>
          </details>
        )
      })}
    </div>
  )
}
