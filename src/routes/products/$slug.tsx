import { Fragment, Suspense, lazy } from 'react'
import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { PRODUCTS } from '~/content/products'
import { pageContent, siteConfigFromMatches } from '~/lib/page-content'
import { usePageContent } from '~/lib/use-page-content'
import { HeroTitle } from '~/components/ui/hero-heading'
import type { PageHero } from '~/data/page-content'
import { isSectionEnabled, orderSections, productStatus } from '~/lib/site-config'
import { useSiteConfig } from '~/lib/use-site-config'
import { useSectionContent } from '~/lib/use-section-content'
import { getSiteConfigFn } from '~/server/functions/site'
import { isPageVisible } from '~/lib/page-visibility'
import type { Product } from '~/content/products'
import { generateMetaTags } from '~/lib/seo/meta'
import { getSoftwareApplicationSchema, getFaqSchema, getBreadcrumbSchema, getVideoSchema } from '~/lib/seo/jsonld'
import { resolveSectionContent } from '~/lib/section-content'
import { FaqAccordion } from '~/components/blocks/FaqAccordion'
import { PartnerBand } from '~/components/blocks/PartnerBand'
import { PricingSection } from '~/components/blocks/PricingSection'
import { pricingFromConfig, yearlyPlan } from '~/lib/pricing'
import { CmsHero } from '~/components/blocks/CmsHero'
import { SectionHeading } from '~/components/blocks/SectionHeading'
import { ScreenBandSection } from '~/components/blocks/ScreenBandSection'
import { CmsCapabilitiesSection } from '~/components/blocks/cms-capabilities'
import { Button } from '~/components/ui/button'
import { Reveal } from '~/components/ui/reveal'
import { 
  CheckCircle2, ArrowRight, Layers,   Monitor, Cpu, Activity, Smartphone, Sparkles 
} from 'lucide-react'

// Only unreleased products show this page, and it carries the waitlist form
// (TanStack Form + schema), so released products such as Viewixsoft CMS do not
// download it. The server still renders it in full.
const ProductComingSoon = lazy(() =>
  import('~/components/blocks/ProductComingSoon').then((m) => ({ default: m.ProductComingSoon })),
)

function cmsOffer(config: ReturnType<typeof siteConfigFromMatches>) {
  const plan = yearlyPlan(pricingFromConfig(config))
  return plan ? { price: plan.price, currency: 'USD', description: 'Per screen licence, per year' } : undefined
}

/** The product tour when the hero shows it with both a video and a poster, otherwise null. */
function shownTour(config: ReturnType<typeof siteConfigFromMatches>) {
  const tour = resolveSectionContent('product-cms:intro-video', config.content['product-cms:intro-video'])
  if (!tour.video || !tour.poster || !isSectionEnabled(config, 'product-cms', 'intro-video')) return null
  return { ...tour, video: tour.video, poster: tour.poster }
}

/**
 * The tour's poster is the page's LCP element, but a `poster` attribute cannot
 * carry fetchpriority and is only found once the <video> is parsed, so it is
 * preloaded from <head> at high priority.
 */
function productTourPosterPreload(config: ReturnType<typeof siteConfigFromMatches>) {
  const tour = shownTour(config)
  if (!tour) return []
  return [{ rel: 'preload', as: 'image', href: tour.poster.url, fetchPriority: 'high' as const }]
}

/** VideoObject for the product tour; Google needs the file and a thumbnail, so it waits for both. */
function productTourLd(config: ReturnType<typeof siteConfigFromMatches>) {
  const tour = shownTour(config)
  if (!tour) return []
  const schema = getVideoSchema({
    title: tour.title,
    description: tour.description,
    src: tour.video.url,
    poster: tour.poster.url,
    uploadDate: tour.video.uploadedAt,
  })
  return [{ type: 'application/ld+json', children: JSON.stringify(schema) }]
}

export const Route = createFileRoute('/products/$slug')({
  loader: async ({ params }) => {
    const base = PRODUCTS.find((p) => p.slug === params.slug)
    if (!base) throw notFound()
    // The admin can switch a product between available, coming soon and hidden.
    const config = await getSiteConfigFn()
    if (!isPageVisible(config, `/products/${base.slug}`)) throw notFound()
    const status = productStatus(config, base)
    if (status === 'hidden') throw notFound()
    return { product: { ...base, status } }
  },
  head: ({ loaderData, matches }) => {
    if (!loaderData?.product) return {}
    const p = loaderData.product
    const comingSoon = p.status === 'coming-soon'
    const seo = generateMetaTags({
      ...pageContent(siteConfigFromMatches(matches), `product-${p.slug}`).seo,
      canonicalUrl: `/products/${p.slug}`,
      markdownPath: `/products/${p.slug}.md`,
    })

    const breadcrumbs = [
      { name: 'Home', path: '/' },
      { name: 'Products', path: '/products' },
      { name: p.name, path: `/products/${p.slug}` },
    ]

    const breadcrumbLd = { type: 'application/ld+json', children: JSON.stringify(getBreadcrumbSchema(breadcrumbs)) }

    // An unreleased product gets no SoftwareApplication or FAQ markup: there is no
    // shipped software or confirmed FAQ to describe yet.
    if (comingSoon) return { meta: seo.meta, links: seo.links, scripts: [breadcrumbLd] }

    return {
      meta: seo.meta,
      links: [...seo.links, ...(p.slug === 'cms' ? productTourPosterPreload(siteConfigFromMatches(matches)) : [])],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(
            getSoftwareApplicationSchema({
              ...p,
              // Only Viewixsoft CMS has published prices so far; the same figure the pricing table shows.
              offer: p.slug === 'cms' ? cmsOffer(siteConfigFromMatches(matches)) : undefined,
            }),
          ),
        },
        {
          type: 'application/ld+json',
          // The same questions the FAQ section shows, edited or not.
          children: JSON.stringify(
            getFaqSchema(
              p.slug === 'cms'
                ? resolveSectionContent('product-cms:faq', siteConfigFromMatches(matches).content['product-cms:faq']).items
                : p.faq,
            ),
          ),
        },
        breadcrumbLd,
        ...(p.slug === 'cms' ? productTourLd(siteConfigFromMatches(matches)) : []),
      ],
    }
  },
  component: ProductDetailPage,
})

function ProductDetailPage() {
  const { product } = Route.useLoaderData()
  const config = useSiteConfig()
  // Hero text is editable in /admin/pages/product-<slug>.
  const { hero } = usePageContent(`product-${product.slug}`)
  // Viewixsoft CMS section text is edited in /admin/pages; other products keep the generic wording.
  const why = useSectionContent('product-cms:why')
  const tour = useSectionContent('product-cms:intro-video')
  const specsIntro = useSectionContent('product-cms:specs')
  const useCasesIntro = useSectionContent('product-cms:use-cases')
  const cmsFaq = useSectionContent('product-cms:faq')
  const specTable = useSectionContent('product-cms:spec-table')
  const isCms = product.slug === 'cms'
  const faqItems = isCms ? cmsFaq.items : product.faq
  const specGroups = isCms ? specTable.groups : product.specs
  if (product.status === 'coming-soon') {
    return (
      <Suspense fallback={null}>
        <ProductComingSoon product={product} hero={hero} />
      </Suspense>
    )
  }

  const specs = (
    <section aria-labelledby="specs-title" className="space-y-8">
      <SectionHeading
        id="specs-title"
        eyebrow={isCms ? specsIntro.eyebrow : 'Specifications'}
        title={isCms ? specsIntro.title : `What does ${product.name} support?`}
        description={
          isCms
            ? specsIntro.description
            : `Supported file formats, player devices and operating systems, screen resolutions and, where offered, the server needed to host ${product.name} yourself.`
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {specGroups.map((specCat, idx) => (
          <Reveal key={specCat.category} delay={(idx % 2) * 100} className="h-full">
            <div className="h-full rounded-2xl panel border border-ink-800 overflow-hidden">
              <div className="px-6 py-4 bg-ink-900 border-b border-ink-800">
                <h3 className="font-bold text-sm text-signal-400 font-mono">{specCat.category}</h3>
                {specCat.note && <p className="mt-1 text-xs text-ink-400">{specCat.note}</p>}
              </div>
              <dl className="divide-y divide-ink-800/60">
                {specCat.items.map((item) => (
                  <div key={item.label} className="px-6 py-3.5 grid gap-1 text-xs sm:grid-cols-[8.5rem_1fr] sm:gap-4">
                    <dt className="text-ink-400 font-medium">{item.label}</dt>
                    <dd className="text-ink-50 font-mono">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
  const useCases = (
    <section aria-labelledby="product-use-cases-title" className="space-y-8">
      <SectionHeading
        id="product-use-cases-title"
        title={isCms ? useCasesIntro.title : `Recommended use cases for ${product.name}`}
      />
      <div className="mx-auto grid max-w-4xl grid-cols-1 sm:grid-cols-2 gap-4">
        {product.relatedUseCases.map((uc, idx) => (
          <Link
            key={idx}
            to="/use-cases/$slug"
            params={{ slug: uc.slug }}
            className="p-5 rounded-xl panel border border-ink-800 hover:border-signal-500/40 transition-all flex items-center justify-between group"
          >
            <span className="font-semibold text-ink-50 group-hover:text-signal-400 transition-colors text-sm">
              {uc.title}
            </span>
            <ArrowRight className="w-4 h-4 text-ink-500 group-hover:text-signal-400 group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>
    </section>
  )
  const faq = (
    <section aria-labelledby="product-faq-title" className="space-y-12 border-t border-ink-900 pt-16">
      <SectionHeading
        id="product-faq-title"
        eyebrow={isCms ? cmsFaq.eyebrow : 'Product FAQ'}
        title={isCms ? cmsFaq.title : 'Frequently asked questions'}
        description={
          isCms
            ? 'Answers to common technical questions about Viewixsoft CMS. Have specific network requirements or need custom pricing? Contact our sales team directly.'
            : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left column: FAQ questions */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <h3 className="font-display text-xl font-semibold text-ink-50">
              Common questions
            </h3>
            <p className="mt-1 text-sm text-ink-400">
              Quick answers about playback stability, remote screen controls, and hardware support.
            </p>
          </div>
          <FaqAccordion items={faqItems} className="w-full max-w-none" />
        </div>

        {/* Right column: the demo request itself is the form on /contact. */}
        <div className="lg:col-span-6">
          <div className="rounded-3xl border border-ink-800 bg-ink-900 p-6 sm:p-8">
            <h3 className="font-display text-xl font-semibold text-ink-50">
              Contact sales & request a demo
            </h3>
            <p className="mt-1 text-sm text-ink-400">
              Speak with a Viewixsoft specialist about screen compatibility, volume licensing, or hardware procurement.
            </p>
            <Button asChild size="lg" className="mt-6 rounded-full px-6">
              <Link to="/contact" preload="intent">
                Book a demo
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )

  // Viewixsoft CMS has its own sections, ordered in /admin/site; other released
  // products use the generic layout.
  const sections =
    product.slug === 'cms'
      ? orderSections(config, 'product-cms', {
          // The product tour plays inside the hero; its own section entry only switches it on or off.
          why: <CmsHero content={why} tour={tour} showTour={isSectionEnabled(config, 'product-cms', 'intro-video')} />,
          capabilities: <CmsCapabilitiesSection />,
          screens: <ScreenBandSection />,
          specs,
          pricing: <PricingSection />,
          'use-cases': useCases,
          faq,
          partner: <PartnerBand />,
        })
      : [
          { key: 'hero', node: <ProductHero product={product} hero={hero} /> },
          {
            key: 'features',
            node: (
                <div className="space-y-12">
                  <div className="text-center max-w-3xl mx-auto space-y-3">
                    <span className="text-xs uppercase tracking-widest text-signal-400 font-bold">Capabilities</span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-ink-50">What can {product.name} do?</h2>
      
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {product.features.map((feat, idx) => (
                      <div key={idx} className="p-6 rounded-2xl panel border border-ink-800 space-y-3">
                        <div className="flex items-center gap-2.5 text-base font-bold text-ink-50">
                          <CheckCircle2 className="w-5 h-5 text-signal-400" />
                          <span>{feat.title}</span>
                        </div>
                        <p className="text-sm text-ink-300 leading-relaxed pl-7">
                          {feat.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
            ),
          },
          { key: 'specs', node: specs },
          { key: 'use-cases', node: useCases },
          { key: 'faq', node: faq },
          { key: 'partner', node: <PartnerBand /> },
        ]

  return (
    // No visible breadcrumb trail here: the page is one level deep and the hero opens it. BreadcrumbList JSON-LD stays in head().
    <div className="page-x pt-10 pb-12 md:pt-16 md:pb-20 space-y-20">
      {sections.map((s) => (
        <Fragment key={s.key}>{s.node}</Fragment>
      ))}
    </div>
  )
}

function ProductHero({ product, hero }: { product: Product; hero: PageHero }) {
  const getIcon = (slug: string) => {
    switch (slug) {
      case 'cms': return <Monitor className="w-10 h-10 text-signal-400" />
      case 'pos': return <Cpu className="w-10 h-10 text-signal-400" />
      case 'tracking': return <Activity className="w-10 h-10 text-signal-400" />
      case 'nfc': return <Smartphone className="w-10 h-10 text-signal-400" />
      default: return <Monitor className="w-10 h-10 text-signal-400" />
    }
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      <div className="lg:col-span-7 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-signal-500/10 border border-signal-500/20 text-xs font-mono text-signal-400 font-medium">
          <span>{hero.eyebrow ?? product.heroBadge}</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-ink-50 tracking-tight leading-tight">
          <HeroTitle hero={hero} />
        </h1>

        <p className="text-xl text-ink-200 font-medium">
          {hero.description ?? product.tagline}
        </p>

        <p className="text-base text-ink-400 leading-relaxed">
          {product.description}
        </p>

        <div className="flex flex-wrap gap-4 pt-2">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-on-gradient bg-brand-gradient shine hover:opacity-90 shadow-xl transition-all"
          >
            <Sparkles className="w-4 h-4 text-on-gradient" />
            {product.status === 'available' ? 'Get started' : 'Get notified at launch'}
          </Link>

        </div>
      </div>

      {/* Hero Interactive Visualization Card */}
      <div className="lg:col-span-5 rounded-3xl panel p-8 border border-ink-800 bg-ink-950/90 space-y-6">
        <div className="flex items-center gap-4 border-b border-ink-800 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-ink-900 border border-ink-800 flex items-center justify-center">
            {getIcon(product.slug)}
          </div>
          <div>
            <div className="text-xs uppercase font-mono text-signal-400 tracking-wider">Software Engine</div>
            <div className="text-xl font-extrabold text-ink-50">{product.name}</div>
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-xs font-mono uppercase tracking-wider text-ink-400">Supported Hardware Platforms:</span>
          <div className="flex flex-wrap gap-2">
            {product.supportedOS.map((os, i) => (
              <span key={i} className="px-2.5 py-1 rounded bg-ink-900 border border-ink-800 text-[11px] font-mono text-ink-300">
                {os}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
