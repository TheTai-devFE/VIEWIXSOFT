import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { z } from 'zod'
import { useState, useMemo } from 'react'
import { ArrowUpRight, Search } from 'lucide-react'
import { USE_CASES } from '~/content/useCases'
import { forPublic, mergeUseCases } from '~/lib/use-case-from-row'
import { CaseStudyMatrix } from '~/components/blocks/CaseStudyMatrix'
import { CaseStudyModeBadge } from '~/components/blocks/CaseStudyModeBadge'
import { getBreadcrumbSchema } from '~/lib/seo/jsonld'
import { generateMetaTags } from '~/lib/seo/meta'
import { getPublishedUseCasesFn } from '~/server/functions/use-cases'
import { CaseStudiesHero } from '~/components/blocks/CaseStudiesHero'
import { CaseStudyCard } from '~/components/blocks/CaseStudyCard'
import { CtaBand } from '~/components/blocks/CtaBand'
import { cn } from '~/lib/cn'
import { getSiteConfigFn } from '~/server/functions/site'
import { isPageVisible } from '~/lib/page-visibility'

const searchSchema = z.object({
  industry: z.string().optional().catch(undefined),
  product: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/case-studies/')({
  validateSearch: searchSchema,
  loader: async () => {
    const config = await getSiteConfigFn()
    if (!isPageVisible(config, '/case-studies')) throw notFound()
    const res = await getPublishedUseCasesFn()
    return { useCases: mergeUseCases(res.ok ? res.useCases : [], USE_CASES).map(forPublic) }
  },
  head: () => {
    const seo = generateMetaTags({
      title: 'Case Studies — Viewixsoft',
      description:
        'Digital signage by industry: which Viewixsoft products fit retail, restaurants, offices, hotels and clinics, and how a rollout works.',
      canonicalUrl: '/case-studies',
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
              { name: 'Case studies', path: '/case-studies' },
            ]),
          ),
        },
      ],
    }
  },
  component: CaseStudiesIndexPage,
})

const PRODUCT_FILTERS = [
  { slug: 'all', label: 'All products' },
  { slug: 'cms', label: 'Viewixsoft CMS' },
  { slug: 'pos', label: 'Viewixsoft POS' },
  { slug: 'tracking', label: 'Viewixsoft Tracking' },
  { slug: 'nfc', label: 'Viewixsoft NFC' },
]

function CaseStudiesIndexPage() {
  const { industry, product } = Route.useSearch()
  const { useCases: allCases } = Route.useLoaderData()
  const [searchQuery, setSearchQuery] = useState('')

  const industries = ['All', ...new Set(allCases.map((u) => u.industry))]
  // Only an approved customer story is featured; industry guides are never dressed up as one.
  const featuredStory = allCases.find((u) => u.mode === 'story')

  const filteredCases = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return allCases.filter((item) => {
      const matchIndustry = !industry || industry.toLowerCase() === 'all' || item.industry.toLowerCase() === industry.toLowerCase()
      const matchProduct = !product || product === 'all' || item.featuredProducts.some((p) => p.slug === product)
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.tagline.toLowerCase().includes(q) ||
        item.industry.toLowerCase().includes(q)
      return matchIndustry && matchProduct && matchSearch
    })
  }, [allCases, industry, product, searchQuery])

  return (
    <div className="page-x space-y-20 py-12 md:py-20">
      <CaseStudiesHero />

      {featuredStory && (
        <section aria-labelledby="featured-story-heading" className="grid overflow-hidden rounded-3xl border border-ink-800 bg-ink-900/60 lg:grid-cols-12">
          <img
            src={featuredStory.cover.src}
            alt={featuredStory.cover.alt}
            width={1200}
            height={675}
            loading="lazy"
            decoding="async"
            className="aspect-video size-full object-cover lg:col-span-7 lg:aspect-auto"
          />
          <div className="space-y-4 p-7 sm:p-10 lg:col-span-5">
            <CaseStudyModeBadge mode="story" />
            <h2 id="featured-story-heading" className="font-display text-2xl font-bold tracking-tight text-ink-50 sm:text-3xl">
              {featuredStory.title}
            </h2>
            <p className="leading-relaxed text-ink-300">{featuredStory.tagline}</p>
            {featuredStory.quote.text && (
              <blockquote className="border-l-2 border-signal-400 pl-4 text-sm text-ink-300">
                “{featuredStory.quote.text}”
                <footer className="mt-1 text-ink-400">
                  {featuredStory.quote.author}, {featuredStory.quote.company}
                </footer>
              </blockquote>
            )}
            <Link
              to="/case-studies/$slug"
              params={{ slug: featuredStory.slug }}
              preload="intent"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-signal-300 hover:text-signal-200"
            >
              Read the customer story
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </section>
      )}

      <section id="industries" aria-labelledby="industries-heading" className="scroll-mt-24 space-y-6">
        <div className="max-w-3xl space-y-3">
          <p className="eyebrow">Industries</p>
          <h2 id="industries-heading" className="font-display text-2xl font-bold tracking-tight text-balance text-ink-50 sm:text-3xl">
            Find your industry
          </h2>
          <p className="text-lg leading-relaxed text-pretty text-ink-300">
            Each page covers the problems screens solve in that industry, the setup to deploy, and how a rollout works.
          </p>
        </div>

        <div className="space-y-4 rounded-3xl border border-ink-800 bg-ink-900/40 p-5 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <nav aria-label="Filter by industry" className="flex flex-wrap gap-2">
              {industries.map((ind) => {
                const active = (!industry && ind === 'All') || industry?.toLowerCase() === ind.toLowerCase()
                return (
                  <Link
                    key={ind}
                    to="/case-studies"
                    search={{ industry: ind === 'All' ? undefined : ind, product }}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'rounded-full px-4 py-1.5 font-mono text-xs font-medium transition-colors',
                      active
                        ? 'border border-signal-400 bg-signal-400 font-bold text-ink-950'
                        : 'border border-ink-800 bg-ink-950 text-ink-300 hover:border-ink-600 hover:text-ink-50',
                    )}
                  >
                    {ind}
                  </Link>
                )
              })}
            </nav>
            <div className="relative md:w-64">
              <label htmlFor="case-study-search" className="sr-only">
                Search industries
              </label>
              <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-ink-500" />
              <input
                id="case-study-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search industries…"
                className="h-9 w-full rounded-full border border-ink-800 bg-ink-950 pr-3 pl-9 text-xs text-ink-100 placeholder:text-ink-500 focus:border-signal-500 focus:outline-none"
              />
            </div>
          </div>

          <nav aria-label="Filter by product" className="flex flex-wrap items-center gap-2 border-t border-ink-800/80 pt-3">
            {PRODUCT_FILTERS.map((p) => {
              const active = (!product && p.slug === 'all') || product === p.slug
              return (
                <Link
                  key={p.slug}
                  to="/case-studies"
                  search={{ industry, product: p.slug === 'all' ? undefined : p.slug }}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'rounded-lg px-2.5 py-1 font-mono text-[11px] transition-colors',
                    active
                      ? 'border border-signal-500/40 bg-signal-500/20 text-signal-300'
                      : 'border border-ink-800 bg-ink-950/70 text-ink-400 hover:text-ink-200',
                  )}
                >
                  {p.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {filteredCases.length === 0 ? (
          <div className="rounded-3xl border border-ink-800 bg-ink-900/40 py-16 text-center">
            <p className="text-lg font-medium text-ink-200">No industry matches these filters.</p>
            <Link
              to="/case-studies"
              className="mt-4 inline-block rounded-lg border border-ink-700 px-4 py-2 text-xs font-semibold text-ink-200 hover:border-ink-500"
            >
              Clear filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCases.map((uc, idx) => (
              <CaseStudyCard key={uc.slug} useCase={uc} eager={idx < 3} />
            ))}
          </div>
        )}
      </section>

      <CaseStudyMatrix useCases={allCases} />

      <CtaBand
        title="Don't see your industry?"
        description="Viewixsoft runs on commercial screens in any business. Tell us where your screens are and what they need to show, and we will suggest a setup."
        primary={{ label: 'Talk to us', to: '/contact' }}
      />
    </div>
  )
}
