import { useId } from 'react'
import { LazySubscribeForm } from '~/components/blocks/LazySubscribeForm'
import { cn } from '~/lib/cn'

/**
 * Centred newsletter band: heading and pitch in the SSR HTML, the topic chips
 * and email field load as the visitor scrolls to it.
 */
export function NewsletterSignup({
  title = 'Get new guides by email',
  description = 'One email when we publish something useful about running digital signage. No spam, unsubscribe any time.',
  className,
}: {
  title?: string
  description?: string
  className?: string
}) {
  const titleId = useId()
  return (
    <section
      aria-labelledby={titleId}
      className={cn('rounded-3xl border border-ink-800 bg-ink-900 px-5 py-10 text-center sm:px-10 sm:py-12', className)}
    >
      <h2 id={titleId} className="font-display text-3xl font-semibold tracking-tight text-balance text-ink-50 sm:text-4xl">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-pretty text-ink-400">{description}</p>
      <LazySubscribeForm className="mt-8" />
    </section>
  )
}
