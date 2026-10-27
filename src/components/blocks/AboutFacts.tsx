import { Reveal } from '~/components/ui/reveal'
import { SectionHeading } from '~/components/blocks/SectionHeading'
import { useSectionContent } from '~/lib/use-section-content'

/**
 * About page "at a glance": four sourced figures in a row, large type and
 * hairlines between them. Edited in /admin/pages → About → At a glance.
 */
export function AboutFacts() {
  const { eyebrow, title, description, items } = useSectionContent('about:facts')
  return (
    <section aria-labelledby="facts-heading" className="page-x py-14 md:py-20">
      <SectionHeading id="facts-heading" eyebrow={eyebrow} title={title} description={description} />
      <Reveal delay={100}>
        {/* The 1px gaps show the border colour behind the cells as hairlines. */}
        <dl className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-ink-800 bg-ink-800 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 bg-ink-950 p-6 sm:p-8">
              <dt className="order-2 text-sm leading-relaxed text-pretty text-ink-400">{item.label}</dt>
              <dd className="order-1 font-display text-4xl font-semibold tracking-tight text-ink-50 sm:text-5xl">{item.value}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  )
}
