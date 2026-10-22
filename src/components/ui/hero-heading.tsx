import type { PageHero } from '~/data/page-content'

/** Renders a hero title with its optional highlighted second part (gradient by default). */
export function HeroTitle({ hero, highlightClassName = 'text-brand-gradient' }: { hero: PageHero; highlightClassName?: string }) {
  return (
    <>
      {hero.title}
      {hero.highlight && (
        <>
          {' '}
          <span className={highlightClassName}>{hero.highlight}</span>
        </>
      )}
    </>
  )
}
