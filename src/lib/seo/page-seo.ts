import type { BlogPost } from '~/content/blog'
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

const DESCRIPTION_MAX = 155

/**
 * A meta description Google shows in full: the text as is when it fits,
 * otherwise the longest run of whole sentences that fits, otherwise cut at a
 * word with an ellipsis.
 */
export function clampDescription(text: string, max = DESCRIPTION_MAX) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const sentences = clean.match(/[^.!?]+[.!?]+(\s|$)/g) ?? []
  let fit = ''
  for (const sentence of sentences) {
    if ((fit + sentence).trim().length > max) break
    fit += sentence
  }
  // A single short opening sentence is too thin a snippet; prefer cutting the text instead.
  if (fit.trim().length >= 60) return fit.trim()
  const cut = clean.slice(0, max)
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,:;–—-]+$/, '')}…`
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

export function useCaseSeo(uc: Pick<UseCase, 'seoTitle' | 'tagline'>): PageSeo {
  return { title: uc.seoTitle, description: clampDescription(uc.tagline) }
}

export function blogPostSeo(post: BlogPost): PageSeo {
  return { title: post.seoTitle, description: post.seoDescription || clampDescription(post.description) }
}
