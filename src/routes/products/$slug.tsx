import { Fragment } from 'react'
import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { PRODUCTS } from '~/content/products'
import { productSeo } from '~/lib/seo/page-seo'
import { orderSections, productStatus } from '~/lib/site-config'
import { useSiteConfig } from '~/lib/use-site-config'
import { getSiteConfigFn } from '~/server/functions/site'
import type { Product } from '~/content/products'
import { Breadcrumbs } from '~/components/layout/Breadcrumbs'
import { generateMetaTags } from '~/lib/seo/meta'
import { getSoftwareApplicationSchema, getFaqSchema, getBreadcrumbSchema } from '~/lib/seo/jsonld'
import { FaqAccordion } from '~/components/blocks/FaqAccordion'
import { CtaBand } from '~/components/blocks/CtaBand'
import { PricingSection } from '~/components/blocks/PricingSection'
import { ProductComingSoon } from '~/components/blocks/ProductComingSoon'
import { TERM_PLANS } from '~/data/pricing'
import { WhyChooseSection } from '~/components/blocks/WhyChooseSection'
import { ScreenBandSection } from '~/components/blocks/ScreenBandSection'
import { CmsCapabilitiesSection } from '~/components/blocks/cms-capabilities'
import { Reveal } from '~/components/ui/reveal'
import { 
  CheckCircle2, ArrowRight, Layers,   Monitor, Cpu, Activity, Smartphone, Sparkles 
} from 'lucide-react'

export const Route = createFileRoute('/products/$slug')({
  loader: async ({ params }) => {
    const base = PRODUCTS.find((p) => p.slug === params.slug)
    if (!base) throw notFound()
    // The admin can switch a product between available, coming soon and hidden.
    const status = productStatus(await getSiteConfigFn(), base)
    if (status === 'hidden') throw notFound()
    return { product: { ...base, status } }
  },
  head: ({ loaderData }) => {
    if (!loaderData?.product) return {}
    const p = loaderData.product
    const comingSoon = p.status === 'coming-soon'
    const seo = generateMetaTags({
      ...productSeo(p),
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
      links: seo.links,
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(
            getSoftwareApplicationSchema({
              ...p,
              // Only Viewixsoft CMS has published prices so far.
              offer:
                p.slug === 'cms' && TERM_PLANS[0]
                  ? { price: TERM_PLANS[0].price, currency: 'USD', description: 'Per screen licence, per year' }
                  : undefined,
            }),
          ),
        },
        {
          type: 'application/ld+json',
          children: JSON.stringify(getFaqSchema(p.faq)),
        },
        breadcrumbLd,
      ],
    }
  },
  component: ProductDetailPage,
})

function ProductDetailPage() {
  const { product } = Route.useLoaderData()
  const config = useSiteConfig()
  if (product.status === 'coming-soon') return <ProductComingSoon product={product} />

  const specs = (
    <section aria-labelledby="specs-title" className="space-y-8">
      <Reveal className="max-w-3xl space-y-3">
        <span className="text-xs uppercase tracking-widest text-signal-400 font-bold">Specifications</span>
        <h2 id="specs-title" className="text-2xl sm:text-3xl font-extrabold text-ink-50">
          What does {product.name} support?
        </h2>
        <p className="text-ink-400">
          Supported file formats, player devices and operating systems, screen resolutions and, where offered, the
          server needed to host {product.name} yourself.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {product.specs.map((specCat, idx) => (
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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-ink-50">Recommended Use Cases for {product.name}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    </div>
  )
  const faq = (
    <div className="space-y-8 border-t border-ink-900 pt-16">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs uppercase tracking-widest text-signal-400 font-bold">Product FAQ</span>
        <h2 className="text-3xl font-extrabold text-ink-50">Frequently Asked Questions</h2>
      </div>
      <FaqAccordion items={product.faq} />
    </div>
  )

  // Viewixsoft CMS has its own sections, ordered in /admin/site; other released
  // products use the generic layout.
  const sections =
    product.slug === 'cms'
      ? orderSections(config, 'product-cms', {
          why: <WhyChooseSection embedded headingLevel="h1" />,
          capabilities: <CmsCapabilitiesSection />,
          screens: <ScreenBandSection />,
          specs,
          pricing: <PricingSection />,
          'use-cases': useCases,
          faq,
        })
      : [
          { key: 'hero', node: <ProductHero product={product} /> },
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
          { key: 'cta', node: <CtaBand /> },
        ]

  return (
    <div className="py-12 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
      <Breadcrumbs items={[
        { name: 'Home', path: '/' },
        { name: 'Products', path: '/products' },
        { name: product.name, path: `/products/${product.slug}` },
      ]} />
      {sections.map((s) => (
        <Fragment key={s.key}>{s.node}</Fragment>
      ))}
    </div>
  )
}

function ProductHero({ product }: { product: Product }) {
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
          <span>{product.heroBadge}</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-ink-50 tracking-tight leading-tight">
          {product.name}
        </h1>

        <p className="text-xl text-ink-200 font-medium">
          {product.tagline}
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
            {product.status === 'available' ? 'Book a demo' : 'Get notified at launch'}
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
