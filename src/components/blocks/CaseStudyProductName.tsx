import { Link } from '@tanstack/react-router'
import { useProducts } from '~/lib/use-site-config'

/**
 * A product named on a case study: linked to its page while the product is
 * shown on the site, plain text otherwise (hidden products have no page).
 */
export function CaseStudyProductName({ slug, fallback }: { slug: string | null; fallback: string }) {
  const product = useProducts().find((p) => p.slug === slug)
  if (!product) return <>{fallback}</>
  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      preload="intent"
      className="font-semibold text-ink-50 underline decoration-ink-700 underline-offset-4 hover:text-signal-300 hover:decoration-signal-400"
    >
      {product.name}
    </Link>
  )
}

/** "Coming soon" for products that are not released yet, so no page promises what is not available. */
export function useComingSoon(slug: string | null) {
  return useProducts().some((p) => p.slug === slug && p.status === 'coming-soon')
}
