import { FaqAccordion } from '~/components/blocks/FaqAccordion'
import { useSectionContent } from '~/lib/use-section-content'
import { Reveal } from '~/components/ui/reveal'

export function HomeFaqSection() {
  const { eyebrow, title, items } = useSectionContent('home:faq')
  return (
    <section aria-labelledby="home-faq-title" className="border-t border-ink-800 bg-ink-950">
      <div className="page-x section-y">
        <Reveal className="mx-auto max-w-2xl text-center">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2
            id="home-faq-title"
            className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance text-ink-50 sm:text-4xl"
          >
            {title}
          </h2>
        </Reveal>
        <Reveal delay={120} className="mt-10">
          <FaqAccordion items={items} />
        </Reveal>
      </div>
    </section>
  )
}
