import { Reveal } from '~/components/ui/reveal'
import { IconStage, VISION_ICONS } from '~/components/blocks/vision-icons'
import { useSectionContent } from '~/lib/use-section-content'

/**
 * About page vision: a dark band (`screen-dark` switches the tokens) with a
 * mono label, a heading whose end glows in the brand gradient, and three
 * glass cards, each with a glowing wireframe icon. Text is edited in
 * /admin/pages → About → Vision; the icons are fixed, one per card.
 */
export function AboutVision({ id }: { id?: string }) {
  const { eyebrow, title, highlight, description, cards } = useSectionContent('about:vision')
  return (
    <section
      id={id}
      aria-labelledby="vision-title"
      className="screen-dark relative isolate scroll-mt-16 overflow-hidden bg-ink-950 text-ink-50"
    >
      {/* Faint guides at the thirds; decorative. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <span className="absolute inset-y-0 left-1/3 w-px bg-ink-50/[0.04]" />
        <span className="absolute inset-y-0 left-2/3 w-px bg-ink-50/[0.04]" />
      </div>

      <div className="page-x py-14 lg:py-20">
        {eyebrow && (
          <Reveal className="text-center font-mono text-xs tracking-[0.275em] text-ink-50/75 uppercase">
            // {eyebrow}
          </Reveal>
        )}

        <Reveal delay={100} className="mx-auto mt-10 max-w-4xl text-center sm:mt-10">
          <h2
            id="vision-title"
            className="font-display text-4xl font-medium tracking-[-0.04em] text-balance text-ink-50 sm:text-6xl"
          >
            {title}
            {highlight && (
              <>
                {' '}
                <span className="text-brand-gradient [filter:drop-shadow(0_0_22px_color-mix(in_oklab,var(--color-gradient-via)_55%,transparent))]">
                  {highlight}
                </span>
              </>
            )}
          </h2>
          {description && (
            <p className="mx-auto mt-6 max-w-2xl text-lg font-light text-pretty text-ink-50/65">{description}</p>
          )}
        </Reveal>

        <ul className="mt-10 grid gap-4 sm:mt-14 lg:grid-cols-3">
          {cards.map((card, i) => {
            const Icon = VISION_ICONS[i]
            const delay = 150 + i * 120
            return (
              <li key={card.id}>
                <Reveal
                  delay={delay}
                  className="group/card relative isolate h-full overflow-hidden rounded-lg border border-ink-50/10 border-t-ink-50/20 bg-ink-50/[0.025] backdrop-blur-[14px] md:grid md:grid-cols-[14rem_1fr] md:items-center lg:block"
                >
                  {/* Soft brand glow behind the icon; decorative. */}
                  <span
                    aria-hidden="true"
                    className="absolute -top-16 left-1/2 -z-10 size-96 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-gradient-via)_22%,transparent),transparent)] md:top-1/2 md:left-28 md:-translate-y-1/2 lg:-top-16 lg:left-1/2 lg:translate-y-0"
                  />
                  <IconStage className="mx-auto h-44 w-full max-w-xs px-6 pt-6">{Icon && <Icon delay={delay + 250} />}</IconStage>
                  <div className="px-6 pt-2 pb-7 md:py-7 md:pl-0 lg:pt-2 lg:pl-6">
                    <h3 className="text-lg font-medium text-ink-50/95">{card.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-pretty text-ink-50/60">{card.body}</p>
                  </div>
                </Reveal>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
