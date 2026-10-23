import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, ArrowUpRight, Mail, X } from 'lucide-react'
import { ViewixLogo } from '~/components/blocks/ViewixLogo'
import { CONTACT_EMAILS } from '~/data/company'
import { useProducts } from '~/lib/use-site-config'

const MENU_ID = 'site-menu'
// Tailwind's lg breakpoint, where SiteHeader shows its inline links.
const DESKTOP_QUERY = '(min-width: 64rem)'

const MAIN_LINKS = [
  { to: '/use-cases', label: 'Use cases' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
] as const

const SALES_EMAIL = CONTACT_EMAILS.find((c) => c.department === 'Sales')?.email

/**
 * Menu button and full-screen menu for screens below lg. A native modal
 * <dialog>: focus is trapped, Escape closes it and the page behind is inert.
 * Any link inside closes it before navigating, and it closes itself when the
 * window grows to the desktop layout.
 */
export function MobileMenu() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const products = useProducts()

  const openMenu = () => {
    if (window.matchMedia(DESKTOP_QUERY).matches) return
    dialogRef.current?.showModal()
    setOpen(true)
    closeRef.current?.focus()
  }
  const closeMenu = () => dialogRef.current?.close()

  // Desktop has the inline links, so the menu closes there; a modal left open would
  // keep the page inert. `resize` backs up `change`, which some device emulators skip.
  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_QUERY)
    const closeOnDesktop = () => {
      if (desktop.matches && dialogRef.current?.open) dialogRef.current.close()
    }
    closeOnDesktop()
    desktop.addEventListener('change', closeOnDesktop)
    window.addEventListener('resize', closeOnDesktop)
    return () => {
      desktop.removeEventListener('change', closeOnDesktop)
      window.removeEventListener('resize', closeOnDesktop)
    }
  }, [])

  // Rows enter one after another; `step` keeps the stagger in one place.
  let step = 0
  const delay = () => ({ transitionDelay: `${60 + step++ * 35}ms` })

  return (
    <>
      <button
        type="button"
        onClick={openMenu}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={MENU_ID}
        className="group inline-flex items-center gap-3 rounded-full border border-ink-700 px-4 py-2 font-mono text-xs tracking-[0.16em] text-ink-100 uppercase transition-colors hover:border-ink-500 lg:hidden"
      >
        Menu
        <span aria-hidden="true" className="flex w-4 flex-col gap-1">
          <span className="h-px w-full bg-current" />
          <span className="h-px w-2/3 bg-current transition-[width] group-hover:w-full" />
        </span>
      </button>

      <dialog
        ref={dialogRef}
        id={MENU_ID}
        aria-label="Site menu"
        onClose={() => setOpen(false)}
        className="site-menu fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto bg-ink-950 p-0 text-ink-50 backdrop:bg-transparent"
      >
        {/* Delegated: any link click inside the menu closes it before navigating. */}
        <div
          className="page-x flex min-h-full flex-col"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('a')) closeMenu()
          }}
        >
          <div className="flex h-16 shrink-0 items-center justify-between px-3 sm:px-4">
            <Link to="/" aria-label="Viewixsoft home" className="text-ink-50">
              <ViewixLogo className="h-5 sm:h-6" withSoft />
            </Link>
            <button
              ref={closeRef}
              type="button"
              onClick={closeMenu}
              aria-label="Close menu"
              className="grid size-10 place-items-center rounded-full border border-ink-700 text-ink-100 transition-colors hover:border-ink-500"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>

          <nav aria-label="Main" className="flex-1 pt-2 pb-8">
            <ul className="divide-y divide-ink-800 border-b border-ink-800">
              <li className="menu-item pb-4" style={delay()}>
                <Link
                  to="/products"
                  className="flex items-center justify-between py-3.5 font-display text-2xl font-semibold tracking-tight"
                  activeProps={{ className: 'text-signal-400', 'aria-current': 'page' }}
                  activeOptions={{ exact: true }}
                >
                  Products
                  <ArrowRight aria-hidden="true" className="size-5 text-ink-500" />
                </Link>
                {/* Names only: the taglines are too long for a phone row. */}
                <ul className="grid grid-cols-2 gap-2">
                  {products.map((p) => (
                    <li key={p.slug} className="min-w-0">
                      <Link
                        to="/products/$slug"
                        params={{ slug: p.slug }}
                        className="flex h-full flex-col items-start gap-1.5 rounded-xl border border-ink-800 bg-ink-900 px-3.5 py-3 transition-colors hover:border-ink-600"
                        activeProps={{ className: 'border-signal-500', 'aria-current': 'page' }}
                      >
                        <span className="text-sm leading-snug font-medium text-ink-50">{p.name}</span>
                        {p.status === 'coming-soon' && (
                          <span className="rounded-full border border-ink-700 px-2 py-0.5 font-mono text-[10px] tracking-wider text-ink-400 uppercase">
                            Soon
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              {MAIN_LINKS.map((l) => (
                <li key={l.to} className="menu-item" style={delay()}>
                  <Link
                    to={l.to}
                    className="flex items-center justify-between py-3.5 font-display text-2xl font-semibold tracking-tight"
                    activeProps={{ className: 'text-signal-400', 'aria-current': 'page' }}
                  >
                    {l.label}
                    <ArrowRight aria-hidden="true" className="size-5 text-ink-500" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Actions stay at the bottom, within thumb reach. */}
          <div className="menu-item sticky bottom-0 -mx-(--spacing-page-gutter) border-t border-ink-800 bg-ink-950 px-(--spacing-page-gutter) pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]" style={delay()}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                to="/products/$slug"
                params={{ slug: 'cms' }}
                className="bg-brand-gradient shine inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-on-gradient hover:opacity-90"
              >
                Get started
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink-700 px-5 py-3 text-sm font-semibold text-ink-50 transition-colors hover:border-ink-500"
              >
                Contact sales
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
            {SALES_EMAIL && (
              <a
                href={`mailto:${SALES_EMAIL}`}
                className="mt-4 flex items-center justify-center gap-2 text-sm text-ink-400 hover:text-ink-50"
              >
                <Mail aria-hidden="true" className="size-4" />
                {SALES_EMAIL}
              </a>
            )}
          </div>
        </div>
      </dialog>
    </>
  )
}
