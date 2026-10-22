import { useEffect, useState } from 'react'
import { cn } from '~/lib/cn'
import { CHAPTERS } from '~/components/story/story-content'

/**
 * Fixed chapter index on the left edge (xl and up). Highlights the chapter
 * whose section crosses the middle of the viewport.
 */
export function ChapterRail() {
  const [active, setActive] = useState(CHAPTERS[0]?.id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id)
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    for (const c of CHAPTERS) {
      const el = document.getElementById(c.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  return (
    <nav aria-label="Story chapters" className="fixed left-4 top-1/2 z-30 hidden -translate-y-1/2 xl:block">
      <ol className="space-y-3 border-l border-ink-800">
        {CHAPTERS.map((c) => {
          const isActive = c.id === active
          return (
            <li key={c.id}>
              <a
                href={`#${c.id}`}
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  '-ml-px flex items-center gap-2 border-l py-0.5 pl-3 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors',
                  isActive ? 'border-signal-400 text-signal-400' : 'border-transparent text-ink-500 hover:text-ink-200',
                )}
              >
                {c.code}
                <span className={cn('transition-opacity', isActive ? 'opacity-100' : 'sr-only')}>{c.label}</span>
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
