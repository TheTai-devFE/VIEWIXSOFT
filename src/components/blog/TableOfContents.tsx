import { useEffect, useState } from 'react'
import { ArrowUp, BookmarkCheck, ListTree } from 'lucide-react'
import type { TocItem } from '~/lib/toc'
import { cn } from '~/lib/cn'

export function TableOfContents({ toc }: { toc: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>('')
  const [readingProgress, setReadingProgress] = useState(0)

  useEffect(() => {
    if (toc.length === 0) return

    const headingElements = toc
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[]

    if (headingElements.length === 0) return

    const handleScroll = () => {
      const scrollY = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? Math.min(100, Math.max(0, Math.round((scrollY / docHeight) * 100))) : 0
      setReadingProgress(progress)

      // Find which heading is currently active (closest above viewport top + offset)
      let currentActive = headingElements[0]?.id ?? ''
      for (let i = headingElements.length - 1; i >= 0; i--) {
        const el = headingElements[i]
        if (el && el.offsetTop - 140 <= scrollY) {
          currentActive = el.id
          break
        }
      }
      setActiveId(currentActive)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [toc])

  if (toc.length < 2) return null

  const handleHeadingClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const target = document.getElementById(id)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      history.pushState(null, '', `#${id}`)
      setActiveId(id)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <nav aria-label="Table of contents" className="w-full">
      <div className="overflow-hidden rounded-2xl border border-ink-800/80 bg-ink-950/70 p-4 shadow-sm backdrop-blur-md">
        {/* Header */}
        <div className="mb-3 space-y-2 border-b border-ink-800/60 pb-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-ink-300 uppercase font-mono">
              On this page
            </span>
            <span className="font-mono text-[11px] font-semibold text-signal-300">
              {readingProgress}%
            </span>
          </div>
          {/* Reading progress line */}
          <div className="h-0.5 w-full overflow-hidden rounded-full bg-ink-900">
            <div
              className="h-full rounded-full bg-signal-400 transition-all duration-150"
              style={{ width: `${readingProgress}%` }}
            />
          </div>
        </div>

        {/* Headings List */}
        <div className="max-h-[calc(100vh-220px)] space-y-1 overflow-y-auto pr-1 text-sm select-none">
          {toc.map((item) => {
            const isActive = activeId === item.id
            const isH2 = item.depth === 2
            const isH3 = item.depth === 3

            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleHeadingClick(e, item.id)}
                className={cn(
                  'group flex items-center rounded-lg px-2.5 py-1.5 text-xs transition-all leading-snug',
                  isH2 && 'font-medium',
                  isH3 && 'ml-3 border-l border-ink-800/80 pl-2.5 text-[11.5px]',
                  item.depth >= 4 && 'ml-5 border-l border-ink-800/60 pl-2.5 text-[11px]',
                  isActive
                    ? 'border-signal-500 bg-signal-950/70 font-semibold text-signal-300 shadow-xs'
                    : 'text-ink-400 hover:bg-ink-900/50 hover:text-ink-100',
                )}
              >
                <span className="truncate">{item.text}</span>
              </a>
            )
          })}
        </div>

        {/* Scroll To Top */}
        <div className="mt-3 border-t border-ink-800/60 pt-2.5">
          <button
            type="button"
            onClick={scrollToTop}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1 font-mono text-[11px] text-ink-400 transition-colors hover:bg-ink-900 hover:text-ink-200"
          >
            <ArrowUp className="size-3 text-signal-400" />
            <span>Back to top</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
