import { FaqAccordion } from '~/components/blocks/FaqAccordion'
import { HOME_FAQ } from '~/data/home-faq'
import { Reveal } from '~/components/ui/reveal'

export function HomeFaqSection() {
  return (
    <section aria-labelledby="home-faq-title" className="border-t border-ink-800 bg-ink-950">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">FAQ</p>
          <h2
            id="home-faq-title"
            className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance text-ink-50 sm:text-4xl"
          >
            Questions about Viewixsoft
          </h2>
        </Reveal>
        <Reveal delay={120} className="mt-10">
          <FaqAccordion items={HOME_FAQ} />
        </Reveal>
      </div>
    </section>
  )
}
