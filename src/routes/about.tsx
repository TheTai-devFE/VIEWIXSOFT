import { Fragment } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { pageContent, siteConfigFromMatches } from '~/lib/page-content'
import { generateMetaTags } from '~/lib/seo/meta'
import { getBreadcrumbSchema } from '~/lib/seo/jsonld'
import { ThreeDMarquee } from '~/components/ui/3d-marquee'
import { Reveal } from '~/components/ui/reveal'
import { CustomerMarquee } from '~/components/blocks/CustomerMarquee'
import { SectionHeading } from '~/components/blocks/SectionHeading'
import { AboutVision } from '~/components/blocks/AboutVision'
import { EARLY_CUSTOMER_PLACEHOLDERS } from '~/data/early-customers'
import type { EarlyCustomer } from '~/data/early-customers'
import { AboutResults, resultStories } from '~/components/blocks/AboutResults'
import { orderSections, SHOW_SAMPLE_CONTENT } from '~/lib/site-config'
import { useSectionContent } from '~/lib/use-section-content'
import { useSiteConfig } from '~/lib/use-site-config'
import { imageUrl, useMedia, useScreenWall } from '~/lib/use-media'
import { RollLink } from '~/components/ui/roll-link'
import { cn } from '~/lib/cn'

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

// Same width, gutters and rhythm as the Viewixsoft CMS page.
const container = 'page-x'

function AboutPage() {
  const config = useSiteConfig()
  const customers = useCustomers()
  const stories = resultStories()
  // Order and visibility come from /admin/pages → About; text from each section's editor there.
  const sections = orderSections(config, 'about', {
    hero: <AboutHero />,
    story: <AboutStory />,
    vision: <AboutVision id="vision" />,
    results: stories.length > 0 && <AboutResults stories={stories} />,
    customers: customers.length > 0 && <AboutCustomers customers={customers} />,
  })
  return (
    <>
      {sections.map((section) => (
        <Fragment key={section.key}>{section.node}</Fragment>
      ))}
    </>
  )
}

function AboutHero() {
  // Twelve tiles so each of the marquee's three columns stays full.
  const wall = useScreenWall(12)
  const { eyebrow, title, highlight, description } = useSectionContent('about:hero')
  return (
    <header className="relative isolate overflow-hidden px-4 py-24 text-center sm:px-6 md:py-32">
      <div className="absolute inset-0 -z-10 opacity-60" aria-hidden="true">
        <ThreeDMarquee images={wall} className="h-full max-xl:h-full max-sm:h-full rounded-none" />
      </div>
      <div
        className="absolute inset-0 -z-10 bg-radial from-ink-950 from-25% via-ink-950/85 to-ink-950/40"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-4xl">
        {eyebrow && <p className="text-base text-ink-400 sm:text-lg">{eyebrow}</p>}
        <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight text-balance text-ink-50 sm:text-7xl">
          {title}
          {highlight && (
            <>
              {/* Keeps the words apart for screen readers and search; the lines are blocks visually. */}{' '}
              <span className="block text-ink-400">{highlight}</span>
            </>
          )}
        </h1>
        {description && <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-ink-400">{description}</p>}
      </div>
    </header>
  )
}

function StoryPhoto({ slot, className }: { slot: string; className: string }) {
  const photo = useMedia(slot)
  if (!photo) return null
  return (
    <img
      src={imageUrl(photo.src, 1200)}
      alt={photo.alt}
      width={photo.width}
      height={photo.height}
      loading="lazy"
      className={`w-full rounded-2xl object-cover ${className}`}
    />
  )
}

function AboutStory() {
  const { eyebrow, title, paragraphs, cta } = useSectionContent('about:story')
  const [lead, ...rest] = paragraphs
  return (
    <section aria-labelledby="story-heading" className={`${container} py-14 md:py-20`}>
      <SectionHeading id="story-heading" eyebrow={eyebrow} title={title} />

      {/* Phones: text, then the photos (side by side from sm). Desktop: small photo | text | large photo,
          the photos sitting on one baseline. One set of elements, placed by the grid. */}
      <Reveal
        delay={100}
        className="mt-12 grid gap-4 sm:grid-cols-[45fr_55fr] sm:gap-5 lg:mt-14 lg:grid-cols-[24%_minmax(0,1fr)_40%] lg:items-end lg:gap-6 xl:gap-8"
      >
        <div className="order-first mb-6 text-center sm:col-span-2 lg:order-none lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:mb-0 lg:self-start">
          {lead && <p className="mx-auto max-w-xl text-lg leading-relaxed font-medium text-pretty text-ink-100 xl:text-xl">{lead.text}</p>}
          <div className="mt-6 flex justify-center">
            <RollLink to="/contact">{cta}</RollLink>
          </div>
        </div>
        <StoryPhoto slot="about.story.small" className="aspect-[4/3] lg:col-start-1 lg:row-start-1" />
        <StoryPhoto slot="about.story.large" className="aspect-[3/2] lg:col-start-3 lg:row-start-1" />
      </Reveal>

      {rest.length > 0 && (
        <Reveal
          delay={150}
          className={cn(
            'mx-auto mt-10 grid gap-6 border-t border-ink-800 pt-8',
            rest.length > 1 ? 'max-w-5xl md:grid-cols-2 md:gap-10' : 'max-w-3xl',
          )}
        >
          {rest.map((p) => (
            <p key={p.id} className="text-lg leading-relaxed text-pretty text-ink-400">
              {p.text}
            </p>
          ))}
        </Reveal>
      )}
    </section>
  )
}

function AboutCustomers({ customers }: { customers: EarlyCustomer[] }) {
  const { eyebrow, title, description } = useSectionContent('about:customers')
  return (
    // Follows the results section, whose bottom padding already separates the two.
    // The marquee runs edge to edge; only the heading keeps the page width.
    <section aria-labelledby="customers-heading" className="pt-6 pb-14 md:pt-8 md:pb-20">
      <div className={container}>
        <SectionHeading id="customers-heading" eyebrow={eyebrow} title={title} description={description} />
      </div>
      <Reveal delay={100} className="mt-10">
        <CustomerMarquee customers={customers} />
      </Reveal>
    </section>
  )
}
