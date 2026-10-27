import { Link } from '@tanstack/react-router'
import { ViewixLogo } from '~/components/blocks/ViewixLogo'
import { useProducts, useSiteConfig } from '~/lib/use-site-config'
import { USE_CASES } from '~/content/useCases'
import { resolveFooterConfig } from '~/data/footer'
import type { FooterSocialLink } from '~/data/footer'
import { SocialIcon } from '~/components/ui/social-icon'
import { isPageVisible } from '~/lib/page-visibility'

const linkClass = 'text-ink-400 transition-colors hover:text-ink-50'

function ColumnHeading({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="font-mono text-[11px] tracking-[0.14em] text-ink-500 uppercase">
      {children}
    </h2>
  )
}

const socialClass = 'flex size-9 items-center justify-center rounded-full border border-ink-800 text-ink-400'

/** Official profiles; one without a URL shows as a faded stand-in in the dev server only. */
function SocialLinks({ socials }: { socials: FooterSocialLink[] }) {
  const shown = socials.filter((s) => s.url || import.meta.env.DEV)
  if (!shown.length) return null
  return (
    <ul aria-label="Viewixsoft on social media" className="mt-6 flex gap-2.5">
      {shown.map((s) => (
        <li key={s.network}>
          {s.url ? (
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Viewixsoft on ${s.label} (opens in a new tab)`}
              className={`${socialClass} transition-colors hover:border-ink-600 hover:text-ink-50`}
            >
              <SocialIcon network={s.network} className="size-4" />
            </a>
          ) : (
            <span title={`${s.label}: add the URL in /admin/footer or src/data/footer.ts`} className={`${socialClass} border-dashed opacity-50`}>
              <SocialIcon network={s.network} className="size-4" />
              <span className="sr-only">{s.label} profile not set yet</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

export function Footer() {
  const products = useProducts()
  const siteConfig = useSiteConfig()
  const footer = resolveFooterConfig(siteConfig.content?.['global:footer'])
  const companyLinks = footer.companyLinks.filter((l) => isPageVisible(siteConfig, l.to))
  const legalLinks = footer.legalLinks.filter((l) => isPageVisible(siteConfig, l.to))

  return (
    <footer className="border-t border-ink-800 bg-ink-950 text-sm">
      <div className="page-x pt-16 pb-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4 lg:grid-cols-6">
          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            <Link to="/" aria-label="Viewixsoft home" className="inline-block text-ink-50">
              <ViewixLogo className="h-6" withSoft />
            </Link>
            <SocialLinks socials={footer.socials} />
          </div>

          <nav aria-labelledby="footer-products">
            <ColumnHeading id="footer-products">Products</ColumnHeading>
            <ul className="mt-4 space-y-3">
              {products.map((p) => (
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
            <ColumnHeading id="footer-use-cases">Case studies</ColumnHeading>
            <ul className="mt-4 space-y-3">
              {USE_CASES.map((uc) => (
                <li key={uc.slug}>
                  <Link to="/case-studies/$slug" params={{ slug: uc.slug }} className={linkClass}>
                    {uc.industry}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-company">
            <ColumnHeading id="footer-company">Company</ColumnHeading>
            <ul className="mt-4 space-y-3">
              {companyLinks.map((l) => (
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
              {legalLinks.map((l) => (
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
              {footer.legalEntity.name}
            </h2>
            <p className="text-ink-400">
              Business Registration No.{' '}
              <span className="font-mono text-ink-200">{footer.legalEntity.businessRegistrationNo}</span>
            </p>
            {footer.legalEntity.hotline && (
              <p className="text-ink-400">
                Hotline:{' '}
                <a
                  href={`tel:${footer.legalEntity.hotline.replace(/\s+/g, '')}`}
                  className="font-mono text-ink-200 hover:text-ink-50"
                >
                  {footer.legalEntity.hotline}
                </a>
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <h3 className="text-ink-500">Registered business address</h3>
            <address className="text-ink-300 not-italic">
              {footer.legalEntity.addressLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </address>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-ink-500">Contact</h3>
            <ul className="space-y-1.5">
              {footer.contacts.map((c) => (
                <li key={c.email || c.department} className="text-ink-400">
                  <span>{c.department}: </span>
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="font-mono text-ink-200 transition-colors hover:text-ink-50">
                      {c.email}
                    </a>
                  )}
                  {c.phone && (
                    <span className="block font-mono text-ink-300 mt-0.5">
                      Tel:{' '}
                      <a href={`tel:${c.phone.replace(/\s+/g, '')}`} className="hover:text-ink-50">
                        {c.phone}
                      </a>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="mt-8 border-t border-ink-800 pt-8 text-xs text-ink-500">
          <p>{footer.copyright}</p>
        </div>
      </div>
    </footer>
  )
}
