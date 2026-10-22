import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { ViewixLogo } from '~/components/blocks/ViewixLogo'
import { PRODUCTS } from '~/content/products'
import { USE_CASES } from '~/content/useCases'
import { CONTACT_EMAILS, LEGAL_ENTITY } from '~/data/company'

type FooterLink = { label: string; to: LinkProps['to'] }

const COMPANY_LINKS: FooterLink[] = [
  { label: 'About', to: '/about' },
  { label: 'Blog', to: '/blog' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Contact', to: '/contact' },
]

const LEGAL_LINKS: FooterLink[] = [
  { label: 'Privacy Policy', to: '/legal/privacy' },
  { label: 'Terms of Service', to: '/legal/terms' },
  { label: 'Cookie Policy', to: '/legal/cookies' },
]

const linkClass = 'text-ink-400 transition-colors hover:text-ink-50'

function ColumnHeading({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="font-mono text-[11px] tracking-[0.14em] text-ink-500 uppercase">
      {children}
    </h2>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-ink-800 bg-ink-950 text-sm">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4 lg:grid-cols-6">
          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            <Link to="/" aria-label="Viewixsoft home" className="inline-block text-ink-50">
              <ViewixLogo className="h-6" withSoft />
            </Link>
            <p className="mt-5 max-w-sm text-pretty text-ink-400">
              Viewixsoft builds digital signage software for Viewix screens, so you can manage content on advertising
              screens, kiosks and menu boards from one cloud dashboard.
            </p>
            <Link
              to="/contact"
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-ink-700 px-4 py-2 font-semibold text-ink-50 transition-colors hover:border-ink-500"
            >
              Book a demo
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>

          <nav aria-labelledby="footer-products">
            <ColumnHeading id="footer-products">Products</ColumnHeading>
            <ul className="mt-4 space-y-3">
              {PRODUCTS.map((p) => (
                <li key={p.slug}>
                  <Link to="/products/$slug" params={{ slug: p.slug }} className={linkClass}>
                    {p.name}
                  </Link>
                  {p.status === 'coming-soon' && (
                    <span className="ml-2 rounded-full border border-ink-800 px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-ink-500 uppercase">
                      Soon
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-use-cases">
            <ColumnHeading id="footer-use-cases">Use cases</ColumnHeading>
            <ul className="mt-4 space-y-3">
              {USE_CASES.map((uc) => (
                <li key={uc.slug}>
                  <Link to="/use-cases/$slug" params={{ slug: uc.slug }} className={linkClass}>
                    {uc.industry}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-company">
            <ColumnHeading id="footer-company">Company</ColumnHeading>
            <ul className="mt-4 space-y-3">
              {COMPANY_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-legal">
            <ColumnHeading id="footer-legal">Legal</ColumnHeading>
            <ul className="mt-4 space-y-3">
              {LEGAL_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <section
          aria-labelledby="footer-entity"
          className="mt-14 grid grid-cols-1 gap-8 border-t border-ink-800 pt-8 text-xs md:grid-cols-3"
        >
          <div className="space-y-1.5">
            <h2 id="footer-entity" className="font-bold tracking-wide text-ink-50 uppercase">
              {LEGAL_ENTITY.name}
            </h2>
            <p className="text-ink-400">
              Business Registration No.{' '}
              <span className="font-mono text-ink-200">{LEGAL_ENTITY.businessRegistrationNo}</span>
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-ink-500">Registered business address</h3>
            <address className="text-ink-300 not-italic">
              {LEGAL_ENTITY.addressLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </address>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-ink-500">Contact</h3>
            <ul className="space-y-1">
              {CONTACT_EMAILS.map((c) => (
                <li key={c.email} className="text-ink-400">
                  {c.department}:{' '}
                  <a href={`mailto:${c.email}`} className="font-mono text-ink-200 transition-colors hover:text-ink-50">
                    {c.email}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="mt-8 border-t border-ink-800 pt-8 text-xs text-ink-500">
          {/* TODO(content): use the registered legal entity name once confirmed. */}
          <p>
            © {new Date().getFullYear()} Viewixsoft. All rights reserved. Viewixsoft is part of Viewix.
          </p>
        </div>
      </div>
    </footer>
  )
}
