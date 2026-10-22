import type { BlogPost } from '~/content/blog-posts'
import type { Product } from '~/content/products'
import { PRODUCT_ONE_LINERS } from '~/content/products'
import type { UseCase } from '~/content/useCases'

/**
 * Title and description for each content page, in one place so the route
 * `head()`, the sitemap and the SEO limit tests all read the same values.
 */
export interface PageSeo {
  title: string
  description: string
}

export function productSeo(p: Product): PageSeo {
  if (p.status === 'coming-soon') {
    return {
      title: `${p.name}: coming soon`,
      description: `${PRODUCT_ONE_LINERS[p.slug] ?? ''} ${p.name} is in development. Get an email when it launches.`.trim(),
    }
  }
  return { title: p.seoTitle, description: p.shortDescription }
}

export function useCaseSeo(uc: UseCase): PageSeo {
  return { title: uc.seoTitle, description: uc.tagline }
}

export function blogPostSeo(post: BlogPost): PageSeo {
  return { title: post.seoTitle, description: post.description }
}
