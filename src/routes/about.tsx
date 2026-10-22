import { Fragment } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { pageContent, siteConfigFromMatches } from '~/lib/page-content'
import { usePageContent } from '~/lib/use-page-content'
import { generateMetaTags } from '~/lib/seo/meta'
import { getBreadcrumbSchema } from '~/lib/seo/jsonld'
import { ThreeDMarquee } from '~/components/ui/3d-marquee'
import { Reveal } from '~/components/ui/reveal'
import { EarlyCustomersMarquee } from '~/components/blocks/EarlyCustomersMarquee'
import { EARLY_CUSTOMER_PLACEHOLDERS } from '~/data/early-customers'
import type { EarlyCustomer } from '~/data/early-customers'
import { orderSections, SHOW_SAMPLE_CONTENT } from '~/lib/site-config'
import { useSiteConfig } from '~/lib/use-site-config'
import { useScreenWall } from '~/lib/use-media'
import {
  CERTIFICATIONS,
  COMPANY_FACTS_SOURCE,
  CONTACT_EMAILS,
  LEGAL_ENTITY,
  ORIGIN_STORY,
  VIEWIX_STATS,
} from '~/data/company'

export const Route = createFileRoute('/about')({
  head: ({ matches }) => {
    const seo = generateMetaTags({
      ...pageContent(siteConfigFromMatches(matches), 'about').seo,
      canonicalUrl: '/about',
    })
    return {
      meta: seo.meta,
      links: seo.links,
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(
            getBreadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'About', path: '/about' },
            ]),
          ),
        },
      ],
    }
  },
  component: AboutPage,
})



/**
 * Approved testimonials from /admin/site. Placeholders show in the dev server
 * only; production hides the section until a real quote is approved.
 */
function useCustomers(): EarlyCustomer[] {
  const { testimonials } = useSiteConfig()
  if (testimonials.length > 0) {
    return testimonials.map((t) => ({
      name: t.name,
      role: t.role,
      company: t.company,
      quote: t.quote,
      uses: t.uses,
      avatar: t.avatarUrl ?? undefined,
      rating: toRating(t.rating),
    }))
  }
  return SHOW_SAMPLE_CONTENT ? EARLY_CUSTOMER_PLACEHOLDERS : []
}

function toRating(value: number | null): EarlyCustomer['rating'] {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5 ? value : undefined
}

function HatchBand() {
  return <div className="h-10 hatch border-y border-dashed border-ink-800" aria-hidden="true" />
}

function AboutPage() {
  const config = useSiteConfig()
  const customers = useCustomers()
  const sections = orderSections(config, 'about', {
    hero: <AboutHero />,
    story: <AboutStory />,
    foundation: <AboutFoundation />,
    customers: customers.length > 0 && <AboutCustomers customers={customers} />,
    company: <AboutCompany />,
  })

  // Hatched bands separate sections, so hiding one never leaves two bands together.
  return (
    <div className="max-w-7xl mx-auto border-x border-dashed border-ink-800">
      {sections.map((section, i) => (
        <Fragment key={section.key}>
          {i > 0 && <HatchBand />}
          {section.node}
        </Fragment>
      ))}
    </div>
  )
}

function AboutHero() {
  // Twelve tiles so each of the marquee's three columns stays full.
  const wall = useScreenWall(12)
  // About shows the highlight as a muted second line rather than a gradient.
  const { hero } = usePageContent('about')
  return (
    <header className="relative isolate overflow-hidden px-4 sm:px-6 py-32 md:py-44 text-center">
      <div className="absolute inset-0 -z-10 opacity-60" aria-hidden="true">
        <ThreeDMarquee images={wall} className="h-full max-xl:h-full max-sm:h-full rounded-none" />
      </div>
      <div
        className="absolute inset-0 -z-10 bg-radial from-ink-950 from-25% via-ink-950/85 to-ink-950/40"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-3xl space-y-6">
        {hero.eyebrow && <p className="eyebrow">{hero.eyebrow}</p>}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
          <span className="block text-ink-50">{hero.title}</span>
          {hero.highlight && (
            <>
              {/* Keeps the words apart for screen readers and search; the lines are blocks visually. */}{' '}
              <span className="block text-ink-400">{hero.highlight}</span>
            </>
          )}
        </h1>
        {hero.description && <p className="mx-auto max-w-xl text-lg text-ink-300 leading-relaxed">{hero.description}</p>}
      </div>
    </header>
  )
}

function AboutStory() {
  return (
    <section aria-labelledby="story-heading" className="grid grid-cols-1 md:grid-cols-2">
      <div className="px-4 sm:px-8 py-12 md:py-16">
        <h2 id="story-heading" className="text-4xl sm:text-5xl font-black tracking-tight text-ink-50">
          Our story
        </h2>
      </div>
      <div className="px-4 sm:px-8 py-12 md:py-16 space-y-5 border-t md:border-t-0 md:border-l border-dashed border-ink-800">
        {ORIGIN_STORY.map((paragraph) => (
          <p key={paragraph.slice(0, 24)} className="text-ink-300 text-lg leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  )
}

function AboutFoundation() {
  return (
    <section aria-labelledby="foundation-heading">
      <div className="px-4 sm:px-8 py-12 md:py-16 space-y-3 border-b border-dashed border-ink-800">
        <h2 id="foundation-heading" className="text-4xl sm:text-5xl font-black tracking-tight text-ink-50">
          The hardware behind us
        </h2>
        <p className="text-ink-400">
          Viewix, our parent company, is certified {CERTIFICATIONS.join(' · ')}.
        </p>
      </div>
      <dl className="grid grid-cols-2 lg:grid-cols-4">
        {VIEWIX_STATS.map((stat, index) => (
          <Reveal
            key={stat.label}
            delay={index * 80}
            className="flex flex-col-reverse gap-2 px-4 sm:px-8 py-10 border-dashed border-ink-800 odd:border-r lg:border-r lg:last:border-r-0 nth-[-n+2]:border-b lg:nth-[-n+2]:border-b-0"
          >
            <dt className="text-sm text-ink-400">{stat.label}</dt>
            <dd className="text-3xl sm:text-5xl font-black font-mono text-brand-gradient">
              {stat.value}
            </dd>
          </Reveal>
        ))}
      </dl>
      <p className="px-4 sm:px-8 py-4 border-t border-dashed border-ink-800 text-xs text-ink-400">
        Source:{' '}
        <a
          href={COMPANY_FACTS_SOURCE.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-signal-400"
        >
          {COMPANY_FACTS_SOURCE.label}
        </a>
        , accessed <time dateTime={COMPANY_FACTS_SOURCE.accessedAt}>Oct 16, 2026</time>.
      </p>
    </section>
  )
}

function AboutCustomers({ customers }: { customers: EarlyCustomer[] }) {
  return (
    <section aria-labelledby="customers-heading">
      <div className="px-4 sm:px-8 py-12 md:py-16 space-y-3 border-b border-dashed border-ink-800">
        <h2 id="customers-heading" className="text-4xl sm:text-5xl font-black tracking-tight text-ink-50">
          Our first customers
        </h2>
        <p className="text-ink-400">
          The first businesses running Viewix screens with Viewixsoft software.
        </p>
      </div>
      <div className="py-10 md:py-14">
        <EarlyCustomersMarquee customers={customers} />
      </div>
    </section>
  )
}

function AboutCompany() {
  return (
    <section aria-labelledby="company-heading" className="grid grid-cols-1 md:grid-cols-3 text-sm">
      <div className="px-4 sm:px-8 py-10 space-y-2">
        <h2 id="company-heading" className="font-bold uppercase tracking-wide text-ink-50">
          {LEGAL_ENTITY.name}
        </h2>
        <p className="text-ink-400">
          Business Registration No.{' '}
          <span className="font-mono text-ink-100">{LEGAL_ENTITY.businessRegistrationNo}</span>
        </p>
      </div>
      <div className="px-4 sm:px-8 py-10 space-y-2 border-t md:border-t-0 md:border-l border-dashed border-ink-800">
        <h3 className="text-ink-400">Registered business address</h3>
        <address className="not-italic text-ink-100">
          {LEGAL_ENTITY.addressLines.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </address>
      </div>
      <div className="px-4 sm:px-8 py-10 space-y-2 border-t md:border-t-0 md:border-l border-dashed border-ink-800">
        <h3 className="text-ink-400">Contact</h3>
        <ul className="space-y-1">
          {CONTACT_EMAILS.map((contact) => (
            <li key={contact.email}>
              <span className="text-ink-400">{contact.department}: </span>
              <a
                href={`mailto:${contact.email}`}
                className="font-mono font-semibold text-ink-50 hover:text-signal-400"
              >
                {contact.email}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
