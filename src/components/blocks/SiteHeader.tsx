import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, X } from 'lucide-react'
import { useProducts } from '~/lib/use-site-config'
import { SUPPORTED_HARDWARE } from '~/components/story/story-content'
import { ViewixLogo } from '~/components/blocks/ViewixLogo'
import { cn } from '~/lib/cn'

const MENU_ID = 'site-menu'

const SECONDARY_LINKS = [
  { to: '/use-cases', label: 'Use cases' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
] as const

// Shown inline from lg up; smaller screens use the full-screen menu.
const DESKTOP_LINKS = [
  { to: '/products', label: 'Products' },
  { to: '/use-cases', label: 'Use cases' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'About' },
] as const

const PRODUCT_LIGHT: Record<string, string> = {
  cms: 'bg-light-cms',
  pos: 'bg-light-pos',
  nfc: 'bg-light-nfc',
  tracking: 'bg-light-tracking',
}

/**
 * Fixed control bar: logo, the demo CTA and a single "Menu" button.
 * It floats transparently over the page top (the home hero runs underneath)
 * and gains a solid surface once the page scrolls. Navigation lives in a
 * full-screen channel guide instead of a row of links.
 */
export function SiteHeader() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const products = useProducts()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const openMenu = () => {
    dialogRef.current?.showModal()
    setOpen(true)
    closeRef.current?.focus()
  }
  const closeMenu = () => dialogRef.current?.close()

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 h-16 border-b transition-colors duration-200',
        scrolled ? 'border-ink-800 bg-ink-950/85 backdrop-blur-md' : 'border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="Viewixsoft home" className="shrink-0 text-ink-50 transition-colors hover:text-signal-300">
          <ViewixLogo className="shine-text h-5 sm:h-6" title="Viewixsoft" withSoft />
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {DESKTOP_LINKS.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  preload="intent"
                  className="rounded-md px-3 py-2 text-sm font-medium text-ink-300 transition-colors hover:text-ink-50"
                  activeProps={{ className: 'text-ink-50', 'aria-current': 'page' }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/contact"
            className="hidden items-center gap-2 rounded-md bg-brand-gradient shine px-4 py-2 text-sm font-semibold text-on-gradient transition-colors hover:opacity-90 sm:inline-flex"
          >
            Book a demo
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={openMenu}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={MENU_ID}
            className="group inline-flex items-center gap-3 rounded-md border border-ink-700 px-3 py-2 font-mono lg:hidden text-xs uppercase tracking-[0.16em] text-ink-100 transition-colors hover:border-ink-500"
          >
            Menu
            <span aria-hidden="true" className="flex w-4 flex-col gap-1">
              <span className="h-px w-full bg-current" />
              <span className="h-px w-2/3 bg-current transition-[width] group-hover:w-full" />
            </span>
          </button>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        id={MENU_ID}
        aria-label="Site menu"
        onClose={() => setOpen(false)}
        className="site-menu fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto bg-ink-950 p-0 text-ink-50 backdrop:bg-transparent"
      >
        {/* Delegated: any link click inside the guide closes it before navigating. */}
        <div
          className="mx-auto flex min-h-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('a')) closeMenu()
          }}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-ink-800">
            <Link to="/" aria-label="Viewixsoft home" className="text-ink-50">
              <ViewixLogo className="h-5 sm:h-6" withSoft />
            </Link>
            <button
              ref={closeRef}
              type="button"
              onClick={closeMenu}
              className="inline-flex items-center gap-2 rounded-md border border-ink-700 px-3 py-2 font-mono text-xs uppercase tracking-[0.16em] text-ink-100 transition-colors hover:border-ink-500"
            >
              Close
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          <nav aria-label="Main" className="grid flex-1 gap-12 py-10 lg:grid-cols-12 lg:gap-8 lg:py-16">
            <div className="lg:col-span-7">
              <p className="eyebrow">Channel guide · Products</p>
              <ul className="mt-6 divide-y divide-ink-800 border-y border-ink-800">
                {products.map((p, i) => (
                  <li key={p.id} className="menu-item" style={{ transitionDelay: `${60 + i * 40}ms` }}>
                    <Link
                      to="/products/$slug"
                      params={{ slug: p.slug }}
                      className="group grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 py-5 sm:grid-cols-[4.5rem_1fr_auto]"
                    >
                      <span className="font-mono text-xs text-ink-500 group-hover:text-signal-400">CH {String(i + 1).padStart(2, '0')}</span>
                      <span className="min-w-0">
                        <span className="block font-display text-2xl font-semibold tracking-tight transition-colors group-hover:text-signal-300 sm:text-4xl">
                          {p.name}
                        </span>
                        <span className="mt-1 block truncate text-sm text-ink-400">{p.tagline}</span>
                      </span>
                      <span className="flex items-center gap-3">
                        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${PRODUCT_LIGHT[p.slug] ?? 'bg-ink-600'}`} />
                        <ArrowRight aria-hidden="true" className="h-5 w-5 -translate-x-1 text-ink-600 transition-all group-hover:translate-x-0 group-hover:text-signal-400" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                to="/products"
                className="mt-5 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-signal-400 hover:text-signal-300"
              >
                All products <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="lg:col-span-4 lg:col-start-9">
              <p className="eyebrow">Explore</p>
              <ul className="mt-6 space-y-1">
                {SECONDARY_LINKS.map((l, i) => (
                  <li key={l.to} className="menu-item" style={{ transitionDelay: `${220 + i * 40}ms` }}>
                    <Link
                      to={l.to}
                      className="inline-block py-1.5 font-display text-xl text-ink-200 transition-colors hover:text-ink-50 sm:text-2xl"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-10 rounded-lg border border-ink-800 bg-ink-900 p-5">
                <p className="eyebrow text-ink-400">Book a demo</p>
                <p className="mt-2 text-ink-200">Tell us about your screen network and we will recommend the right setup.</p>
                <Link
                  to="/contact"
                  className="mt-4 inline-flex items-center gap-2 rounded-md bg-brand-gradient shine px-4 py-2.5 text-sm font-semibold text-on-gradient transition-colors hover:opacity-90"
                >
                  Book a demo
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </nav>

          <p className="border-t border-ink-800 py-5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-500">
            Runs on {SUPPORTED_HARDWARE.join(' · ')}
          </p>
        </div>
      </dialog>
    </header>
  )
}
