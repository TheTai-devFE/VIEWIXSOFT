import { useEffect, useState } from 'react'
import { Link, linkOptions } from '@tanstack/react-router'
import { MobileMenu } from '~/components/blocks/MobileMenu'
import { ViewixLogo } from '~/components/blocks/ViewixLogo'
import { cn } from '~/lib/cn'

// Shown inline from lg up; smaller screens use MobileMenu.
// Products opens Viewixsoft CMS directly while it is the only available product;
// it becomes a dropdown once there are more.
const DESKTOP_LINKS = [
  { link: linkOptions({ to: '/products/$slug', params: { slug: 'cms' } }), label: 'Products' },
  { link: linkOptions({ to: '/use-cases' }), label: 'Use cases' },
  { link: linkOptions({ to: '/pricing' }), label: 'Pricing' },
  { link: linkOptions({ to: '/blog' }), label: 'Blog' },
  { link: linkOptions({ to: '/about' }), label: 'About' },
]

/**
 * Fixed bar: logo on the left, the main links centred, the CTA on the right
 * (below lg, MobileMenu opens a full-screen menu instead). Transparent
 * over the page top; once the page scrolls it drops a little, draws in from
 * both sides and becomes a floating frosted-glass pill. Only opacity and transform animate.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          'page-x origin-top transition-transform duration-300 ease-out motion-reduce:transition-none',
          // Drops a little and draws in from both sides; a scale, so only transform animates.
          scrolled && 'translate-y-3 scale-90',
        )}
      >
        <div className="relative isolate grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-5 px-3 sm:px-4 lg:px-5">
          {/* The glass pill, faded in on scroll; decorative. 80% keeps link text at AA contrast over dark bands too. */}
          <span
            aria-hidden="true"
            className={cn(
              'absolute inset-0 -z-10 rounded-full border border-ink-800/70 bg-ink-950/80 shadow-lg backdrop-blur-xl backdrop-saturate-150 transition-opacity duration-300 motion-reduce:transition-none',
              scrolled ? 'opacity-100' : 'opacity-0',
            )}
          />
          <Link to="/" aria-label="Viewixsoft home" className="shrink-0 justify-self-start text-ink-50 transition-colors hover:text-signal-300">
            <ViewixLogo className="shine-text h-5 sm:h-6" title="Viewixsoft" withSoft />
          </Link>

          <nav aria-label="Primary" className="col-start-2 hidden lg:block">
            <ul className="flex items-center gap-1">
              {DESKTOP_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    {...l.link}
                    preload="intent"
                    className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-400 transition-colors hover:text-ink-50"
                    activeProps={{ className: 'text-ink-50', 'aria-current': 'page' }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="col-start-3 flex items-center gap-2 justify-self-end">
            <Link
              to="/products/$slug"
              params={{ slug: 'cms' }}
              className="hidden items-center rounded-full bg-ink-50 px-5 py-2 text-sm font-semibold text-ink-950 transition-opacity hover:opacity-85 sm:inline-flex"
            >
              Get started
            </Link>
            <MobileMenu />
          </div>
        </div>
      </div>

    </header>
  )
}
