import { Link } from '@tanstack/react-router'
import type { UseCase } from '~/content/useCases'
import { useProducts } from '~/lib/use-site-config'

type Fit = 'core' | 'add-on' | 'recommended' | null

/**
 * The page's role for a product: from the recommended setup when the page
 * has one, otherwise any product the page features counts as recommended.
 */
export function productFit(uc: Pick<UseCase, 'setup' | 'featuredProducts'>, productSlug: string): Fit {
  const row = uc.setup.find((s) => s.productSlug === productSlug)
  if (row) return row.need
  if (uc.setup.length === 0 && uc.featuredProducts.some((p) => p.slug === productSlug)) return 'recommended'
  return null
}

const FIT_LABEL: Record<Exclude<Fit, null>, string> = { core: 'Core', 'add-on': 'Add-on', recommended: 'Recommended' }

/** Which Viewixsoft product fits which industry, readable in one look. */
export function CaseStudyMatrix({ useCases }: { useCases: UseCase[] }) {
  const products = useProducts()
  if (useCases.length === 0 || products.length === 0) return null

  return (
    <section aria-labelledby="matrix-heading" className="space-y-6">
      <div className="max-w-3xl space-y-3">
        <p className="eyebrow">Product fit</p>
        <h2 id="matrix-heading" className="font-display text-2xl font-bold tracking-tight text-balance text-ink-50 sm:text-3xl">
          Which Viewixsoft product fits which industry?
        </h2>
        <p className="text-lg leading-relaxed text-pretty text-ink-300">
          Each row shows what an industry page recommends. Core products are where you start; add-ons extend them.
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-ink-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-ink-900/80 font-mono text-xs tracking-wider text-ink-400 uppercase">
            <tr>
              <th scope="col" className="px-5 py-3 font-medium">Industry</th>
              {products.map((p) => (
                <th key={p.slug} scope="col" className="px-5 py-3 font-medium">
                  {p.name}
                  {p.status === 'coming-soon' && <span className="block text-[10px] text-warning normal-case">Coming soon</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {useCases.map((uc) => (
              <tr key={uc.slug}>
                <th scope="row" className="px-5 py-3 font-semibold text-ink-50">
                  <Link
                    to="/case-studies/$slug"
                    params={{ slug: uc.slug }}
                    preload="intent"
                    className="underline decoration-ink-700 underline-offset-4 hover:text-signal-300 hover:decoration-signal-400"
                  >
                    {uc.industry}
                  </Link>
                </th>
                {products.map((p) => {
                  const fit = productFit(uc, p.slug)
                  return (
                    <td key={p.slug} className={fit === 'core' ? 'px-5 py-3 font-semibold text-signal-300' : 'px-5 py-3 text-ink-300'}>
                      {fit ? FIT_LABEL[fit] : <span className="text-ink-600" aria-label="Not needed">—</span>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
