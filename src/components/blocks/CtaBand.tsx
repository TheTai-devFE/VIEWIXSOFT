import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

export function CtaBand({
  title = 'See Viewixsoft CMS on your screens',
  description = 'Tell us how many screens you run and where. We will show you how to manage them from one dashboard and send a quote for your setup.',
}: {
  title?: string
  description?: string
}) {
  return (
    <section aria-labelledby="cta-band-title" className="py-20">
      <div className="page-x">
        <div className="rounded-3xl border border-ink-800 bg-ink-900 p-8 text-center sm:p-14">
          <div className="mx-auto max-w-2xl space-y-6">
            <h2
              id="cta-band-title"
              className="font-display text-3xl font-semibold tracking-tight text-balance text-ink-50 sm:text-4xl"
            >
              {title}
            </h2>
            <p className="text-lg text-pretty text-ink-400">{description}</p>
            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
              <Link
                to="/products/$slug"
                params={{ slug: 'cms' }}
                preload="intent"
                className="bg-brand-gradient shine inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-on-gradient hover:opacity-90 sm:w-auto"
              >
                Get started
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                to="/pricing"
                preload="intent"
                className="inline-flex w-full items-center justify-center rounded-lg border border-ink-700 px-6 py-3 text-sm font-semibold text-ink-50 hover:border-ink-500 sm:w-auto"
              >
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
