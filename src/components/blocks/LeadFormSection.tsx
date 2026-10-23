import { Link } from '@tanstack/react-router'
import { ArrowRight, Plus } from 'lucide-react'
import { Reveal } from '~/components/ui/reveal'
import { useSectionContent } from '~/lib/use-section-content'

/** Numbered "what happens next" list on /contact. */
export function LeadNextSteps({ animate = false }: { animate?: boolean }) {
  const { steps } = useSectionContent('home:demo-form')
  return (
    <ol className="mt-10 space-y-5">
      {steps.map((step, i) => {
        const content = (
          <>
            <span className="font-mono text-sm text-signal-400">0{i + 1}</span>
            <span className="text-ink-200">{step.text}</span>
          </>
        )
        return (
          <li key={step.id} className={animate ? undefined : 'flex gap-4'}>
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

/** Corner crosshair of the framed band; centred on the frame's corner. */
function CornerMark({ className }: { className: string }) {
  return <Plus aria-hidden="true" strokeWidth={1.25} className={`absolute size-6 text-ink-500 ${className}`} />
}

/**
 * Home page contact band: the partner pitch with links to /contact and the Viewixsoft CMS page.
 * The demo form itself lives on /contact.
 */
export function ContactCtaSection() {
  const { partner } = useSectionContent('home:demo-form')
  if (!partner.show) return null
  return (
    <section id="contact" aria-labelledby="contact-cta-title" className="bg-ink-950">
      <div className="section-y page-x">
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

            <div className="relative mx-auto max-w-2xl">
              {partner.eyebrow && <p className="eyebrow">{partner.eyebrow}</p>}
              <h2
                id="contact-cta-title"
                className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance text-ink-50 sm:text-4xl"
              >
                {partner.title}
              </h2>
              {partner.description && <p className="mt-4 text-lg text-pretty text-ink-400">{partner.description}</p>}

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/contact"
                  preload="intent"
                  className="inline-flex w-full items-center justify-center rounded-lg border border-ink-700 bg-ink-950 px-5 py-2.5 text-sm font-semibold text-ink-50 transition-colors hover:border-ink-500 sm:w-auto"
                >
                  {partner.cta}
                </Link>
                <Link
                  to="/products/$slug"
                  params={{ slug: 'cms' }}
                  preload="intent"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink-50 px-5 py-2.5 text-sm font-semibold text-ink-950 transition-opacity hover:opacity-90 sm:w-auto"
                >
                  Get started
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
