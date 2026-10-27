import { legacySections } from '~/content/useCases'
import type { UseCase } from '~/content/useCases'
import type { UseCaseRow } from '~/server/db/schema'

const FALLBACK_COVER = '/devices/stock/retail-screens.webp'

const isoDate = (d: Date | string) => new Date(d).toISOString().slice(0, 10)

/** A published database row in the shape the case study pages render. */
export function useCaseFromRow(row: UseCaseRow): UseCase {
  return {
    slug: row.slug,
    title: row.title,
    seoTitle: row.seoTitle || row.title,
    industry: row.industry,
    challengeHeading: row.challengeHeading,
    solutionHeading: row.solutionHeading,
    publishedAt: isoDate(row.publishedAt ?? row.createdAt),
    updatedAt: isoDate(row.updatedAt),
    // Admin rows are real content; whether figures show is decided by `mode`.
    evidence: 'verified',
    cover: { src: row.coverUrl || FALLBACK_COVER, alt: row.coverAlt || row.title },
    tagline: row.tagline,
    challenge: row.challenge,
    solution: row.solution,
    results: row.results,
    featuredProducts: row.featuredProducts,
    quote: row.quote ?? { text: '', author: '', title: '', company: '' },
    mode: row.mode,
    highlights: row.highlights,
    sections: row.sections.length > 0 ? row.sections : legacySections(row),
    setup: row.setup,
    stories: row.stories,
    faq: row.faq,
    reviewedBy: row.reviewedBy,
  }
}

/** Database rows first; the bundled sample stories only fill slugs the database does not have. */
export function mergeUseCases(rows: UseCaseRow[], fallback: UseCase[]): UseCase[] {
  const fromDb = rows.map(useCaseFromRow)
  const slugs = new Set(fromDb.map((u) => u.slug))
  return [...fromDb, ...fallback.filter((u) => !slugs.has(u.slug))]
}

/**
 * What a public page may receive. Figures and quotes of anything but an
 * approved customer story are dropped before they reach the browser, so they
 * are not in the page source (loader data) either.
 */
export function forPublic(uc: UseCase): UseCase {
  if (uc.mode === 'story') return uc
  return { ...uc, results: [], stories: [], quote: { text: '', author: '', title: '', company: '' } }
}
