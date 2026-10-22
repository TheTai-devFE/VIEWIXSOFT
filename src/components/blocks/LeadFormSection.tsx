import { Link } from '@tanstack/react-router'
import { Reveal } from '~/components/ui/reveal'
import { LeadForm } from '~/components/blocks/LeadForm'

export const LEAD_NEXT_STEPS = [
  'We review your screens and locations.',
  'We email you to book a call at a time that suits you.',
  'You see Viewixsoft CMS running on a setup like yours.',
]

/** Numbered "what happens next" list shared by the home section and /contact. */
export function LeadNextSteps({ animate = false }: { animate?: boolean }) {
  return (
    <ol className="mt-10 space-y-5">
      {LEAD_NEXT_STEPS.map((step, i) => {
        const content = (
          <>
            <span className="font-mono text-sm text-signal-400">0{i + 1}</span>
            <span className="text-ink-200">{step}</span>
          </>
        )
        return (
          <li key={step} className={animate ? undefined : 'flex gap-4'}>
            {animate ? (
              <Reveal variant="left" delay={150 + i * 120} className="flex gap-4">
                {content}
              </Reveal>
            ) : (
              content
            )}
          </li>
        )
      })}
    </ol>
  )
}

export function LeadFormSection() {
  return (
    <section id="demo" aria-labelledby="lead-form-title" className="border-t border-ink-800 bg-ink-950">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-28">
        <Reveal className="lg:col-span-5">
          <p className="eyebrow">Book a demo</p>
          <h2
            id="lead-form-title"
            className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance text-ink-50 sm:text-5xl"
          >
            See Viewixsoft on <span className="text-brand-gradient">your screens</span>
          </h2>
          <p className="mt-5 text-lg text-pretty text-ink-400">
            Tell us how many screens you run and where. The Viewixsoft team will show you how to manage them from one
            dashboard.
          </p>

          <LeadNextSteps animate />

          <p className="mt-10 text-sm text-ink-400">
            Need to share more detail?{' '}
            <Link to="/contact" className="font-semibold text-signal-400 hover:text-signal-300">
              Use the full contact form
            </Link>
          </p>
        </Reveal>

        <Reveal variant="right" delay={120} className="lg:col-span-7">
          <LeadForm variant="quick" idPrefix="lead" />
        </Reveal>
      </div>
    </section>
  )
}
