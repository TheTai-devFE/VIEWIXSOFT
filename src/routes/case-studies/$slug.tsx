import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { USE_CASES } from '~/content/useCases'
import { assetUrl, generateMetaTags } from '~/lib/seo/meta'
import { useCaseSeo } from '~/lib/seo/page-seo'
import { getArticleSchema, getBreadcrumbSchema, getFaqSchema } from '~/lib/seo/jsonld'
import { CtaBand } from '~/components/blocks/CtaBand'
import { CaseStudyCard } from '~/components/blocks/CaseStudyCard'
import { CaseStudyHero } from '~/components/blocks/CaseStudyHero'
import { CaseStudyFeatureCards } from '~/components/blocks/CaseStudyFeatureCards'
import { CaseStudyStories } from '~/components/blocks/CaseStudyStories'
import { CaseStudyContent } from '~/components/blocks/CaseStudyContent'
import { CaseStudyProof } from '~/components/blocks/CaseStudyProof'
import { CaseStudySection } from '~/components/blocks/CaseStudySection'
import { FaqAccordion } from '~/components/blocks/FaqAccordion'
import { getPublishedUseCaseBySlugFn, getPublishedUseCasesFn } from '~/server/functions/use-cases'
import { getSiteConfigFn } from '~/server/functions/site'
import { isPageVisible } from '~/lib/page-visibility'
import { useProducts } from '~/lib/use-site-config'
import { forPublic, mergeUseCases, useCaseFromRow } from '~/lib/use-case-from-row'

export const Route = createFileRoute('/case-studies/$slug')({
  loader: async ({ params }) => {
    const config = await getSiteConfigFn()
    if (!isPageVisible(config, `/case-studies/${params.slug}`)) throw notFound()

    // The database copy wins; the bundled sample only covers slugs it does not have.
    const dbRes = await getPublishedUseCaseBySlugFn({ data: { slug: params.slug } })
    const found = dbRes.ok ? useCaseFromRow(dbRes.useCase) : USE_CASES.find((u) => u.slug === params.slug)
    if (!found) throw notFound()
    const useCase = forPublic(found)

    const listRes = await getPublishedUseCasesFn()
    const all = listRes.ok ? mergeUseCases(listRes.useCases, USE_CASES) : USE_CASES
    const related = all.filter((c) => c.slug !== useCase.slug).slice(0, 3).map(forPublic)

    return { useCase, related }
  },

  head: ({ loaderData }) => {
    if (!loaderData?.useCase) return {}
    const uc = loaderData.useCase
    const path = `/case-studies/${uc.slug}`
    const seo = generateMetaTags({
      ...useCaseSeo(uc),
      canonicalUrl: path,
      ogType: 'article',
      ogImage: assetUrl(uc.cover.src),
      markdownPath: `${path}.md`,
    })

    const breadcrumbs = [
      { name: 'Home', path: '/' },
      { name: 'Case studies', path: '/case-studies' },
      { name: uc.title, path },
    ]

    const schemas: object[] = [
      getArticleSchema({
        type: 'Article',
        title: uc.title,
        description: uc.tagline,
        path,
        publishedAt: uc.publishedAt,
        updatedAt: uc.updatedAt,
        authorName: 'Viewixsoft',
        authorType: 'Organization',
        image: uc.cover.src,
      }),
      getBreadcrumbSchema(breadcrumbs),
    ]
    if (uc.faq.length > 0) schemas.push(getFaqSchema(uc.faq))

    return {
      meta: seo.meta,
      links: seo.links,
      scripts: schemas.map((schema) => ({ type: 'application/ld+json', children: JSON.stringify(schema) })),
    }
  },
  component: CaseStudyDetailPage,
})

function CaseStudyDetailPage() {
  const { useCase: uc, related } = Route.useLoaderData()
  const industry = uc.industry
  const products = useProducts()
  // "Explore product" opens the first core product of the setup, else the first featured one.
  const leadSlug =
    uc.setup.find((s) => s.productSlug && s.need === 'core')?.productSlug ?? uc.featuredProducts[0]?.slug ?? null
  const leadProduct = products.find((p) => p.slug === leadSlug) ?? null

  return (
    <div className="page-x space-y-24 py-12 md:space-y-32 md:py-20">
      {/* No visible breadcrumb trail; BreadcrumbList JSON-LD stays in head(). */}
      <div className="space-y-10">
        <CaseStudyHero
          title={uc.title}
          summary={uc.tagline}
          mode={uc.mode}
          updatedAt={uc.updatedAt}
          reviewedBy={uc.reviewedBy}
          product={leadProduct ? { slug: leadProduct.slug, name: leadProduct.name } : null}
          cover={uc.cover}
          highlights={uc.highlights}
        />
      </div>

      <CaseStudyContent sections={uc.sections} />
      <CaseStudyFeatureCards industry={industry} items={uc.setup} />
      <CaseStudyStories industry={industry} stories={uc.stories} />
      <CaseStudyProof mode={uc.mode} results={uc.results} />

      {uc.faq.length > 0 && (
        <CaseStudySection id="faq" eyebrow="FAQ" title={`Questions ${industry.toLowerCase()} teams ask`}>
          <FaqAccordion items={uc.faq} className="mx-0" />
        </CaseStudySection>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="space-y-6 border-t border-ink-800 pt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="related-heading" className="font-display text-3xl font-medium tracking-tight text-ink-50 sm:text-4xl">
              Other industries
            </h2>
            <Link to="/case-studies" className="text-sm font-semibold text-signal-300 hover:text-signal-200">
              All industries →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((c) => (
              <CaseStudyCard key={c.slug} useCase={c} />
            ))}
          </div>
        </section>
      )}

      <CtaBand
        title={`Plan your ${industry.toLowerCase()} screen network`}
        description="Tell us how many locations and screens you run. We will suggest a setup and walk you through it in a demo."
        primary={{ label: 'Book a demo', to: '/contact' }}
      />
    </div>
  )
}
