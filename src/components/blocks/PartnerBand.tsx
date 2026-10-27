import { useId } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { FramedBand } from '~/components/blocks/FramedBand'
import { useSectionContent } from '~/lib/use-section-content'

/**
 * "Partner with us": the partner pitch with links to /contact and the
 * Viewixsoft CMS page. Shown at the end of blog posts and product pages; the
 * text and the on/off switch are edited in /admin/pages → Home → Newsletter & partner band.
 */
export function PartnerBand() {
  const { partner } = useSectionContent('home:demo-form')
  const titleId = useId()
  if (!partner.show) return null
  return (
    <section aria-labelledby={titleId}>
      <FramedBand>
        <div className="relative mx-auto max-w-2xl">
          {partner.eyebrow && <p className="eyebrow">{partner.eyebrow}</p>}
          <h2
            id={titleId}
            className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance text-ink-50 sm:text-4xl"
          >
            {partner.title}
          </h2>
          {partner.description && <p className="mt-4 text-lg text-pretty text-ink-400">{partner.description}</p>}

          {/* Site-wide button pair: brand gradient for the main action, outline for the other. */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/contact"
              preload="intent"
              className="bg-brand-gradient shine inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-on-gradient hover:opacity-90 sm:w-auto"
            >
              {partner.cta}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              to="/products/$slug"
              params={{ slug: 'cms' }}
              preload="intent"
              className="inline-flex w-full items-center justify-center rounded-lg border border-ink-700 px-5 py-2.5 text-sm font-semibold text-ink-50 transition-colors hover:border-ink-500 sm:w-auto"
            >
              Get started
            </Link>
          </div>
        </div>
      </FramedBand>
    </section>
  )
}
