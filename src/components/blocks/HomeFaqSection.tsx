import { FaqAccordion } from '~/components/blocks/FaqAccordion'
import { Reveal } from '~/components/ui/reveal'
import { useSectionContent } from '~/lib/use-section-content'

export function HomeFaqSection() {
  const { eyebrow, title, items } = useSectionContent('home:faq')

  return (
    <section aria-labelledby="home-faq-title" className="border-t border-ink-800 bg-ink-950">
      <div className="page-x section-y">
        {/* Section heading placed on top */}
        <Reveal className="max-w-2xl">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2
            id="home-faq-title"
            className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance text-ink-50 sm:text-4xl"
          >
            {title}
          </h2>
          <p className="mt-4 text-pretty text-ink-400 text-base leading-relaxed">
            Everything you need to know about Viewixsoft digital signage platform, device compatibility, deployment, and pricing.
          </p>
        </Reveal>

        {/* 2-column layout: Image and Questions aligned horizontally */}
        <div className="mt-10 grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left column: Showcase Image */}
          <Reveal delay={60}>
            <div className="relative overflow-hidden rounded-2xl border border-ink-800 bg-ink-900 shadow-2xl">
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src="/devices/stock/retail-screens.webp"
                  alt="Viewix commercial displays in a retail environment"
                  width={960}
                  height={720}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover transition-transform duration-500 ease-out hover:scale-105 motion-reduce:transition-none"
                />
              </div>
            </div>
          </Reveal>

          {/* Right column: Questions accordion */}
          <Reveal delay={120}>
            <FaqAccordion items={items} className="w-full max-w-none" />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
