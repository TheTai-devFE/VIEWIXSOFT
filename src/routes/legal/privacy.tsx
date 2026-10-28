import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { pageContent, siteConfigFromMatches } from '~/lib/page-content'
import { usePageContent } from '~/lib/use-page-content'
import { generateMetaTags } from '~/lib/seo/meta'
import { ldScripts } from '~/lib/seo/custom-schema'
import { getPageSchemasFn } from '~/server/functions/custom-schemas'
import { getBreadcrumbSchema } from '~/lib/seo/jsonld'
import { ShieldCheck } from 'lucide-react'
import { getSiteConfigFn } from '~/server/functions/site'
import { isPageVisible } from '~/lib/page-visibility'

export const Route = createFileRoute('/legal/privacy')({
  loader: async () => {
    const [config, schemas] = await Promise.all([getSiteConfigFn(), getPageSchemasFn({ data: { path: '/legal/privacy' } })])
    if (!isPageVisible(config, 'legal-privacy')) throw notFound()
    return { schemas }
  },
  head: ({ matches, loaderData }) => {
    const seo = generateMetaTags({
      ...pageContent(siteConfigFromMatches(matches), 'legal-privacy').seo,
      canonicalUrl: '/legal/privacy',
    })
    return {
      meta: seo.meta,
      links: seo.links,
      scripts: ldScripts([
        getBreadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Privacy Policy', path: '/legal/privacy' },
        ]),
      ], loaderData?.schemas),
    }
  },
  component: PrivacyPage,
})

function PrivacyPage() {
  const { hero } = usePageContent('legal-privacy')
  return (
    <div className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
      <div className="space-y-4 border-b border-ink-800 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-signal-500/10 border border-signal-500/20 text-xs font-mono text-signal-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Last Updated: October 2026</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-ink-50">{hero.title}</h1>
        {hero.description && <p className="text-ink-400 text-sm">{hero.description}</p>}
      </div>

      <div className="prose prose-invert prose-cyan max-w-none space-y-6 text-ink-300 text-sm leading-relaxed">
        <h2 className="text-xl font-bold text-ink-50">1. Core Privacy Philosophy</h2>
        <p>
          At Viewixsoft Inc. ("Viewixsoft", "we", "our", or "us"), privacy is built into our software architecture. We believe that physical public spaces must remain respectful of individual privacy. Our digital signage telemetry, audience measurement, and content synchronization services operate under strict "Privacy by Design" frameworks compliant with the European General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).
        </p>

        <h2 className="text-xl font-bold text-ink-50">2. Audience Analytics and Camera Sensors</h2>
        <p>
          When clients deploy Viewixsoft Tracking with optical sensors for audience dwell time measurement:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-ink-300">
          <li><strong>No Video Recording:</strong> Raw camera feeds are processed exclusively in volatile memory (RAM) at the hardware edge.</li>
          <li><strong>No Biometric Retention:</strong> Facial images, identifiers, or personally identifiable characteristics are never saved to storage, never compressed into video files, and never transmitted over the network.</li>
          <li><strong>Aggregated Metrics Only:</strong> The software outputs only scalar mathematical values (e.g., aggregate viewer counts, attention spans in milliseconds).</li>
        </ul>

        <h2 className="text-xl font-bold text-ink-50">3. Information Collected from Website Visitors and Leads</h2>
        <p>
          When you submit a demonstration request, contact enquiry, or newsletter subscription on viewixsoft.com, we collect:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-ink-300">
          <li>Full name, corporate email address, company name, job title, and phone number.</li>
          <li>Screen network dimensions, products of interest, and deployment requirements.</li>
          <li>Technical metadata: anonymized IP hash (we never store raw IP addresses), browser user-agent, and UTM acquisition attribution.</li>
        </ul>

        <h2 className="text-xl font-bold text-ink-50">4. Data Subject Rights & Erasure</h2>
        <p>
          You have the right to request access to, rectification of, or permanent deletion of your personal contact data stored in our CRM. To exercise these rights, please email <strong>privacy@viewixsoft.com</strong>.
        </p>
      </div>
    </div>
  )
}
