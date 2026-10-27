import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

/**
 * Opens /case-studies by answering what the page is for. No fleet-wide
 * figures here until there are real, sourced ones to show.
 */
export function CaseStudiesHero() {
  return (
    <header className="max-w-3xl space-y-5">
      <p className="eyebrow">Case studies</p>
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-balance text-ink-50 sm:text-5xl lg:text-6xl">
        Digital signage solutions by industry
      </h1>
      <p className="text-lg leading-relaxed text-pretty text-ink-300 sm:text-xl">
        See which Viewixsoft products fit your business, how a rollout works, and what your screens show on a normal day.
      </p>
      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <a
          href="#industries"
          className="bg-brand-gradient inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-on-gradient hover:opacity-90"
        >
          Find your industry
        </a>
        <Link
          to="/contact"
          preload="intent"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink-700 px-6 py-3 text-sm font-semibold text-ink-50 hover:border-ink-500"
        >
          Book a demo
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </header>
  )
}
