import type { ReactNode } from 'react'
import type { SectionImage } from '~/lib/case-study'
import { cn } from '~/lib/cn'

/**
 * A text block beside an image. Rows alternate which side the image sits on
 * (see `imageSides`); on phones the text always comes first. Without an image
 * the text keeps a readable single column.
 */
export function CaseStudySplit({
  id,
  eyebrow,
  title,
  answer,
  image,
  imageSide = 'right',
  children,
}: {
  id: string
  eyebrow?: string
  title: string
  answer?: string
  image?: SectionImage
  imageSide?: 'left' | 'right'
  children?: ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={cn('scroll-mt-24', image && 'grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16')}
    >
      <div className={cn('min-w-0 space-y-6', !image && 'max-w-3xl', image && imageSide === 'left' && 'lg:order-2')}>
        <div className="space-y-4">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2 id={`${id}-heading`} className="font-display text-3xl font-medium tracking-tight text-balance text-ink-50 sm:text-4xl">
            {title}
          </h2>
          {answer && <p className="text-lg leading-relaxed text-pretty text-ink-300">{answer}</p>}
        </div>
        {children}
      </div>
      {image && (
        <img
          src={image.url}
          alt={image.alt}
          width={1200}
          height={900}
          loading="lazy"
          decoding="async"
          className={cn('aspect-[4/3] w-full rounded-3xl border border-ink-800 object-cover', imageSide === 'left' && 'lg:order-1')}
        />
      )}
    </section>
  )
}
