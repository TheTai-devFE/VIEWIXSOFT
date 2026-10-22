import { Fragment } from 'react'
import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { orderSections, SHOW_SAMPLE_CONTENT } from '~/lib/site-config'
import { USE_CASES } from '~/content/useCases'
import { useProducts, useSiteConfig } from '~/lib/use-site-config'
import { Breadcrumbs } from '~/components/layout/Breadcrumbs'
import { generateMetaTags, SITE_URL } from '~/lib/seo/meta'
import { pageContent, siteConfigFromMatches } from '~/lib/page-content'
import { usePageContent } from '~/lib/use-page-content'
import { HeroTitle } from '~/components/ui/hero-heading'
import { getArticleSchema, getBreadcrumbSchema } from '~/lib/seo/jsonld'
import { CtaBand } from '~/components/blocks/CtaBand'
import { 
  ArrowRight, CheckCircle2, Quote, 
  Sparkles, Layers, ShieldCheck, TrendingUp 
} from 'lucide-react'

export const Route = createFileRoute('/use-cases/$slug')({
  loader: ({ params }) => {
    const useCase = USE_CASES.find((u) => u.slug === params.slug)
    if (!useCase) {
      throw notFound()
    }
    // Sample evidence is dropped here, not just hidden, so it never reaches the
    // production HTML (the loader data is serialized into the page).
    const showEvidence = SHOW_SAMPLE_CONTENT || useCase.evidence === 'verified'
    return {
      useCase: {
        ...useCase,
        results: showEvidence ? useCase.results : [],
        quote: showEvidence ? useCase.quote : null,
      },
    }
  },
  head: ({ loaderData, matches }) => {
    if (!loaderData?.useCase) return {}
    const uc = loaderData.useCase
    const seo = generateMetaTags({
      ...pageContent(siteConfigFromMatches(matches), `use-case-${uc.slug}`).seo,
      canonicalUrl: `/use-cases/${uc.slug}`,
      ogType: 'article',
      ogImage: `${SITE_URL}${uc.cover.src}`,
      markdownPath: `/use-cases/${uc.slug}.md`,
    })

    const breadcrumbs = [
      { name: 'Home', path: '/' },
      { name: 'Use Cases', path: '/use-cases' },
      { name: uc.title, path: `/use-cases/${uc.slug}` },
    ]

    return {
      meta: seo.meta,
      links: seo.links,
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(getArticleSchema({
            type: 'Article',
            title: uc.title,
            description: uc.tagline,
            path: `/use-cases/${uc.slug}`,
            publishedAt: uc.publishedAt,
            updatedAt: uc.updatedAt,
            authorName: 'Viewixsoft',
            authorType: 'Organization',
            image: uc.cover.src,
          })),
        },
        {
          type: 'application/ld+json',
          children: JSON.stringify(getBreadcrumbSchema(breadcrumbs)),
        },
      ],
    }
  },
  component: UseCaseDetailPage,
})

function UseCaseDetailPage() {
  const { useCase } = Route.useLoaderData()
  const config = useSiteConfig()
  const products = useProducts()
  // Hero text is editable in /admin/pages/use-case-<slug>.
  const { hero } = usePageContent(`use-case-${useCase.slug}`)
  const sections = orderSections(config, 'use-case', {
    results: useCase.results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {useCase.results.map((res, idx) => (
              <div key={idx} className="p-6 rounded-2xl panel border border-ink-800 text-center space-y-1">
                <div className="text-4xl font-black text-signal-400 font-mono">
                  {res.metric}
                </div>
                <div className="text-xs text-ink-300 font-medium">
                  {res.label}
                </div>
              </div>
            ))}
          </div>
    ),
    'challenge-solution': (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Challenge */}
            <div className="p-8 rounded-3xl panel border border-ink-800 space-y-4 bg-ink-950/80">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider font-mono">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                The Operational Challenge
              </div>
              <h2 className="text-2xl font-bold text-ink-50">
                {useCase.challengeHeading}
              </h2>
              <p className="text-ink-300 text-sm leading-relaxed">
                {useCase.challenge}
              </p>
            </div>

            {/* Solution */}
            <div className="p-8 rounded-3xl panel border border-signal-500/30 space-y-4 bg-ink-900/90">
              <div className="flex items-center gap-2 text-signal-400 font-bold text-xs uppercase tracking-wider font-mono">
                <span className="w-2 h-2 rounded-full bg-signal-400"></span>
                The Viewixsoft Solution
              </div>
              <h2 className="text-2xl font-bold text-ink-50">
                {useCase.solutionHeading}
              </h2>
              <p className="text-ink-300 text-sm leading-relaxed">
                {useCase.solution}
              </p>
            </div>
          </div>
    ),
    products: (
          <div className="p-8 rounded-3xl panel border border-ink-800 space-y-6">
            <h2 className="text-xl font-bold text-ink-50">
              Which Viewixsoft products does this use?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {useCase.featuredProducts.map((p, idx) => (
                <Link
                  key={idx}
                  to="/products/$slug"
                  params={{ slug: p.slug }}
                  className="p-4 rounded-xl bg-ink-900 hover:bg-ink-850 border border-ink-850 hover:border-signal-500/40 flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Layers className="w-5 h-5 text-signal-400" />
                    <span className="font-semibold text-sm text-ink-50 group-hover:text-signal-400 transition-colors">
                      {p.name}
                    </span>
                    {products.find((x) => x.slug === p.slug)?.status === 'coming-soon' && (
                      <span className="rounded-full bg-ink-850 px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-ink-400 uppercase">
                        Coming soon
                      </span>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-ink-500 group-hover:text-signal-400 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
    ),
    quote: useCase.quote && (
          <div className="p-8 sm:p-12 rounded-3xl panel border border-ink-800 bg-ink-950/80 relative">
            <Quote className="w-12 h-12 text-signal-500/20 mb-4" />
            <p className="text-lg sm:text-xl text-ink-50 italic max-w-3xl leading-relaxed mb-6">
              "{useCase.quote.text}"
            </p>
            <div>
              <div className="font-bold text-ink-50 text-sm">{useCase.quote.author}</div>
              <div className="text-xs text-signal-400">{useCase.quote.title}</div>
              <div className="text-xs text-ink-500">{useCase.quote.company}</div>
            </div>
          </div>
    ),
    cta: <CtaBand />,
  })

  return (
    <div className="py-12 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      <Breadcrumbs items={[
        { name: 'Home', path: '/' },
        { name: 'Use Cases', path: '/use-cases' },
        { name: useCase.title, path: `/use-cases/${useCase.slug}` },
      ]} />

      {/* Header */}
      <div className="max-w-4xl space-y-4">
        <span className="px-3 py-1 rounded-full bg-signal-950/60 border border-signal-800/40 text-xs font-mono text-signal-400 font-semibold">
          {hero.eyebrow ?? `${useCase.industry} use case`}
        </span>
        <h1 className="text-4xl sm:text-6xl font-black text-ink-50 tracking-tight leading-tight">
          <HeroTitle hero={hero} />
        </h1>
        {hero.description && <p className="text-xl text-ink-300 leading-relaxed font-medium">{hero.description}</p>}
      </div>

      {sections.map((s) => (
        <Fragment key={s.key}>{s.node}</Fragment>
      ))}
    </div>
  )
}
