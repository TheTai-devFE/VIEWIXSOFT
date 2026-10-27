import { Quote } from 'lucide-react'
import type { Story } from '~/lib/case-study'
import { cn } from '~/lib/cn'

/**
 * Customer quotes, each about one task. The first row pairs a wide card with
 * a narrow one; the rest sit three to a row.
 */
export function CaseStudyStories({ industry, stories }: { industry: string; stories: Story[] }) {
  if (stories.length === 0) return null
  const [first, second, ...rest] = stories

  return (
    <section aria-labelledby="stories-heading" className="space-y-8 border-t border-ink-800 pt-12">
      <h2 id="stories-heading" className="font-display text-3xl font-medium tracking-tight text-ink-50 sm:text-4xl">
        {industry} stories
      </h2>
      <div className="space-y-5">
        {first && (
          <div className={cn('grid grid-cols-1 gap-5', second && 'lg:grid-cols-5')}>
            <StoryCard story={first} className={second ? 'lg:col-span-3' : undefined} />
            {second && <StoryCard story={second} className="lg:col-span-2" />}
          </div>
        )}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((s) => (
              <StoryCard key={s.quote} story={s} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function StoryCard({ story, className }: { story: Story; className?: string }) {
  return (
    <figure className={cn('flex flex-col rounded-3xl border border-ink-800 bg-ink-900/60 p-8', className)}>
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-ink-300">{story.topic}</p>
        <Quote aria-hidden="true" className="size-4 shrink-0 text-signal-400/60" />
      </div>
      <blockquote className="mt-5 flex-1 text-lg leading-relaxed text-ink-50">“{story.quote}”</blockquote>
      <figcaption className="mt-8 border-t border-ink-800 pt-5 text-sm">
        <span className="block font-semibold text-ink-50">{story.role}</span>
        <span className="block text-ink-400">{story.team}</span>
      </figcaption>
    </figure>
  )
}
