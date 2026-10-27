import { Reveal } from '~/components/ui/reveal'
import { FramedBand } from '~/components/blocks/FramedBand'
import { LazySubscribeForm } from '~/components/blocks/LazySubscribeForm'
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

/**
 * Home page newsletter band: topic chips and email sign-up (double opt-in).
 * The "Partner with us" pitch moved to PartnerBand (blog posts, product pages);
 * the demo form itself lives on /contact.
 */
export function HomeNewsletterSection() {
  return (
    <section aria-labelledby="home-newsletter-title" className="bg-ink-950">
      <div className="section-y page-x">
        <FramedBand>
          <div className="relative mx-auto max-w-2xl">
            <p className="eyebrow">Stay in the loop</p>
            <h2
              id="home-newsletter-title"
              className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance text-ink-50 sm:text-4xl"
            >
              Get Viewixsoft updates by email
            </h2>
            <p className="mt-4 text-lg text-pretty text-ink-400">
              Product news, launch dates and practical guides for running digital signage. Pick the products you care
              about.
            </p>
          </div>

          {/* Wider than the pitch so the five topic chips fit on one row. */}
          <LazySubscribeForm className="relative mx-auto mt-10 max-w-3xl" />
        </FramedBand>
      </div>
    </section>
  )
}
