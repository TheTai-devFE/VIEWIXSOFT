import { createFileRoute, notFound } from '@tanstack/react-router'
import { z } from 'zod'
import { SCREEN_RANGES } from '~/components/story/story-content'
import { pageContent, siteConfigFromMatches } from '~/lib/page-content'
import { usePageContent } from '~/lib/use-page-content'
import { HeroTitle } from '~/components/ui/hero-heading'
import { generateMetaTags } from '~/lib/seo/meta'
import { ldScripts } from '~/lib/seo/custom-schema'
import { getPageSchemasFn } from '~/server/functions/custom-schemas'
import { getBreadcrumbSchema, getFaqSchema } from '~/lib/seo/jsonld'
import { FaqAccordion } from '~/components/blocks/FaqAccordion'
import { LeadForm } from '~/components/blocks/LeadForm'
import { LeadNextSteps } from '~/components/blocks/LeadFormSection'
import { CONTACT_EMAILS, LEGAL_ENTITY } from '~/data/company'
import { getSiteConfigFn } from '~/server/functions/site'
import { isPageVisible } from '~/lib/page-visibility'

const SUPPORT_EMAIL = CONTACT_EMAILS.find((c) => c.department === 'Technical support')?.email ?? CONTACT_EMAILS[0].email

// Answers only use facts already confirmed elsewhere on the site (home FAQ, CMS specs, company data).
const CONTACT_FAQS = [
  {
    question: 'Which Viewixsoft products can I ask about?',
    answer: 'Viewixsoft CMS is available now. Viewixsoft POS, Viewixsoft Tracking and Viewixsoft NFC are coming soon; tick them in the form and the Viewixsoft team will include them when planning your setup.'
  },
  {
    question: 'What hardware should we prepare for the pilot?',
    answer: 'An Android 11+ player on a Rockchip RK3566, RK3576 or RK3588 chipset with at least 2 GB RAM and 32 GB storage, connected by Wi-Fi or Ethernet.'
  },
  {
    question: 'I already use Viewixsoft. Where do I get technical support?',
    answer: `Email the support team at ${SUPPORT_EMAIL}. This form is for sales and demo requests.`
  }
]

// Prefill from links elsewhere on the site (GET /contact?email=…&screens=…).
const contactSearchSchema = z.object({
  email: z.string().email().max(254).optional().catch(undefined),
  screens: z.enum(SCREEN_RANGES).optional().catch(undefined),
})

export const Route = createFileRoute('/contact')({
  validateSearch: contactSearchSchema,
  loader: async () => {
    const [config, schemas] = await Promise.all([getSiteConfigFn(), getPageSchemasFn({ data: { path: '/contact' } })])
    if (!isPageVisible(config, 'contact')) throw notFound()
    return { schemas }
  },
  head: ({ matches, loaderData }) => {
    const seo = generateMetaTags({
      ...pageContent(siteConfigFromMatches(matches), 'contact').seo,
      canonicalUrl: '/contact',
    })
    return {
      meta: seo.meta,
      links: seo.links,
      scripts: ldScripts([
        getBreadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Contact sales', path: '/contact' },
        ]),
        getFaqSchema(CONTACT_FAQS),
      ], loaderData?.schemas),
    }
  },
  component: ContactPage,
})

function ContactPage() {
  const search = Route.useSearch()
  const { hero } = usePageContent('contact')

  return (
    <div className="bg-ink-950">
      <section aria-labelledby="contact-title" className="page-x grid gap-12 py-16 lg:grid-cols-12 lg:py-24">
        <div className="lg:col-span-5">
          {hero.eyebrow && <p className="eyebrow">{hero.eyebrow}</p>}
          <h1
            id="contact-title"
            className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance text-ink-50 sm:text-5xl"
          >
            <HeroTitle hero={hero} />
          </h1>
          {hero.description && <p className="mt-5 text-lg text-pretty text-ink-400">{hero.description}</p>}

          <LeadNextSteps />

          <div className="mt-12 space-y-6 border-t border-ink-800 pt-8 text-sm">
            <div>
              <h2 className="font-mono text-xs tracking-[0.14em] text-ink-500 uppercase">Email</h2>
              <ul className="mt-3 space-y-2">
                {CONTACT_EMAILS.map((c) => (
                  <li key={c.email} className="text-ink-400">
                    {c.department}:{' '}
                    <a href={`mailto:${c.email}`} className="font-mono text-ink-200 transition-colors hover:text-signal-400">
                      {c.email}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-mono text-xs tracking-[0.14em] text-ink-500 uppercase">Office</h2>
              <address className="mt-3 text-ink-400 not-italic">
                {LEGAL_ENTITY.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <LeadForm
            variant="full"
            idPrefix="contact"
            initialValues={{ email: search.email ?? '', screenCount: search.screens ?? '' }}
          />
        </div>
      </section>

      <section aria-labelledby="contact-faq-title" className="border-t border-ink-800">
        <div className="page-x space-y-8 py-16 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">FAQ</p>
            <h2 id="contact-faq-title" className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-50">
              Demo and evaluation questions
            </h2>
          </div>
          <FaqAccordion items={CONTACT_FAQS} />
        </div>
      </section>
    </div>
  )
}
