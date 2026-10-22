import { createFileRoute } from '@tanstack/react-router'
import { pageContent, siteConfigFromMatches } from '~/lib/page-content'
import { usePageContent } from '~/lib/use-page-content'
import { generateMetaTags } from '~/lib/seo/meta'

export const Route = createFileRoute('/legal/terms')({
  head: ({ matches }) => {
    const seo = generateMetaTags({
      ...pageContent(siteConfigFromMatches(matches), 'legal-terms').seo,
      canonicalUrl: '/legal/terms',
    })
    return {
      meta: seo.meta,
      links: seo.links,
    }
  },
  component: TermsPage,
})

function TermsPage() {
  const { hero } = usePageContent('legal-terms')
  return (
    <div className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
      <div className="space-y-4 border-b border-ink-800 pb-8">
        <h1 className="text-3xl sm:text-5xl font-black text-ink-50">{hero.title}</h1>
        {hero.description && <p className="text-ink-400 text-sm">{hero.description}</p>}
      </div>

      <div className="prose prose-invert prose-cyan max-w-none space-y-6 text-ink-300 text-sm leading-relaxed">
        <h2 className="text-xl font-bold text-ink-50">1. Software License Grant</h2>
        <p>
          Subject to the terms and timely payment of subscription fees, Viewixsoft grants the client a non-exclusive, non-transferable license to install and run Viewixsoft player software on the number of screens authorized under the active contract.
        </p>

        <h2 className="text-xl font-bold text-ink-50">2. Service Level Agreement (SLA)</h2>
        <p>
          Viewixsoft provides a 99.99% cloud orchestrator availability SLA for Enterprise tiers. In the event of network disruption, local hardware clients are guaranteed to continue playing scheduled media without blackouts.
        </p>

        <h2 className="text-xl font-bold text-ink-50">3. Acceptable Use Policy</h2>
        <p>
          Customers may not use Viewixsoft to display unlawful, infringing, or malicious content on public screens. Viewixsoft reserves the right to disable network access to hardware displaying verified contraband media.
        </p>
      </div>
    </div>
  )
}
