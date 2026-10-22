import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'
import { USE_CASES } from '~/content/useCases'
import { generateMetaTags } from '~/lib/seo/meta'
import { getBreadcrumbSchema } from '~/lib/seo/jsonld'
import { cn } from '~/lib/cn'

const toSlug = (value: string) => value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const INDUSTRIES = [...new Set(USE_CASES.map((u) => u.industry))].map((name) => ({ name, slug: toSlug(name) }))

const searchSchema = z.object({
  industry: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/use-cases/')({
  validateSearch: searchSchema,
  head: () => {
    const seo = generateMetaTags({
      title: 'Digital Signage Use Cases by Industry — Viewixsoft',
      description: 'Discover how Viewixsoft powers retail stores, QSR menu boards, corporate campuses, airports, and DOOH billboard networks.',
      canonicalUrl: '/use-cases',
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
              { name: 'Use cases', path: '/use-cases' },
            ]),
          ),
        },
      ],
    }
  },
  component: UseCasesIndexPage,
})

function FilterChip({ active, industry, children }: { active: boolean; industry?: string; children: string }) {
  return (
    <Link
      to="/use-cases"
      search={industry ? { industry } : {}}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'rounded-full border px-5 py-2.5 font-mono text-sm transition-colors',
        active
          ? 'border-ink-50 bg-ink-50 text-ink-950'
          : 'border-ink-700 text-ink-200 hover:border-ink-400 hover:text-ink-50',
      )}
    >
      {children}
    </Link>
  )
}

function UseCasesIndexPage() {
  const { industry } = Route.useSearch()
  const active = INDUSTRIES.find((i) => i.slug === industry)
  const useCases = active ? USE_CASES.filter((u) => u.industry === active.name) : USE_CASES

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <header className="max-w-3xl space-y-4">
        <h1 className="text-hero font-bold tracking-tight text-ink-50">Digital signage use cases by industry</h1>
        <p className="text-pretty text-lg leading-relaxed text-ink-300">
          See how Viewixsoft software runs screens in stores, restaurants, offices, transit hubs, hotels and
          out-of-home networks: the challenge, the setup and the results.
        </p>
      </header>

      <nav aria-label="Filter by industry" className="flex flex-wrap gap-3">
        <FilterChip active={!active}>All</FilterChip>
        {INDUSTRIES.map((i) => (
          <FilterChip key={i.slug} active={active?.slug === i.slug} industry={i.slug}>
            {i.name}
          </FilterChip>
        ))}
      </nav>

      <ul className="grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2">
        {useCases.map((uc, idx) => (
          <li key={uc.slug}>
            <article className="group relative">
              <div className="aspect-video overflow-hidden rounded-3xl bg-ink-900">
                <img
                  src={uc.cover.src}
                  alt={uc.cover.alt}
                  width={960}
                  height={540}
                  loading={idx < 2 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="size-full object-cover transition-transform duration-500 ease-broadcast group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              </div>
              <div className="mt-6 flex items-start justify-between gap-4 font-mono text-sm uppercase tracking-wide text-ink-400">
                <span className="shrink-0">{uc.industry}</span>
                {/* Full product names per the naming rule; long pairs wrap rather than shorten. */}
                <span className="text-right">{uc.featuredProducts.map((p) => p.name).join(' + ')}</span>
              </div>
              <h2 className="mt-4 text-2xl leading-snug text-ink-50 transition-colors group-hover:text-signal-400">
                {/* Stretched link: the whole card is one click target, announced once. */}
                <Link
                  to="/use-cases/$slug"
                  params={{ slug: uc.slug }}
                  preload="intent"
                  className="after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-4 focus-visible:after:ring-offset-background"
                >
                  {uc.title}
                </Link>
              </h2>
            </article>
          </li>
        ))}
      </ul>
    </div>
  )
}
