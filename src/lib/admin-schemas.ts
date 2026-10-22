import { z } from 'zod'
import { PRODUCTS } from '~/content/products'
import { METRIC_DEFS, SECTION_PAGES, SECTION_PAGE_KEYS } from '~/data/site-sections'
import type { SectionPage } from '~/data/site-sections'
import { PRODUCT_STATUSES } from '~/lib/enums'
import { ADMIN_PAGES } from '~/data/admin-pages'
import { buildTitle, DESCRIPTION_MAX, TITLE_MAX } from '~/lib/seo/meta'

/** Shared by the /admin/site forms and the server functions that save them. */

export const SaveSectionsSchema = z
  .object({
    page: z.enum(SECTION_PAGE_KEYS as [SectionPage, ...SectionPage[]]),
    sections: z.array(z.object({ key: z.string(), enabled: z.boolean(), sortOrder: z.number().int().min(0).max(99) })),
  })
  .superRefine((value, ctx) => {
    const known = new Set<string>(SECTION_PAGES[value.page].sections.map((s) => s.key))
    for (const s of value.sections) {
      if (!known.has(s.key)) ctx.addIssue({ code: 'custom', message: `Unknown section ${s.key}` })
    }
  })

const productSlugs = PRODUCTS.map((p) => p.slug) as [string, ...string[]]

export const SaveProductStatusSchema = z.object({
  slug: z.enum(productSlugs),
  status: z.enum(PRODUCT_STATUSES),
})

/** Number fields arrive as strings from inputs and as numbers from code. */
const numeric = z.union([z.string(), z.number()]).transform((v, ctx) => {
  const n = typeof v === 'number' ? v : Number(v.trim())
  if (typeof v === 'string' && v.trim() === '') {
    ctx.addIssue({ code: 'custom', message: 'Enter a number' })
    return z.NEVER
  }
  if (!Number.isFinite(n)) {
    ctx.addIssue({ code: 'custom', message: 'Enter a number' })
    return z.NEVER
  }
  return n
})

/** Same, but an empty field means "not set". */
const optionalNumeric = z.union([z.string(), z.number()]).transform((v, ctx) => {
  if (typeof v === 'string' && v.trim() === '') return undefined
  const n = Number(v)
  if (!Number.isFinite(n)) {
    ctx.addIssue({ code: 'custom', message: 'Enter a number' })
    return z.NEVER
  }
  return n
})

const metricKeys = METRIC_DEFS.map((m) => m.key) as [string, ...string[]]

export const MetricSchema = z.object({
  key: z.enum(metricKeys),
  value: numeric.pipe(z.number().int('Use a whole number').min(0).max(1_000_000_000)),
  source: z.string().trim().min(3, 'Say where the number comes from, e.g. "CRM export"').max(200),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the date the number was taken (YYYY-MM-DD)'),
})

export const TestimonialSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, 'Name is required').max(120),
  role: z.string().trim().min(2, 'Role is required').max(120),
  company: z.string().trim().min(2, 'Company is required').max(160),
  quote: z.string().trim().min(10, 'Quote is too short').max(600),
  /** Comma-separated in the form, stored as a list. */
  uses: z
    .string()
    .max(300)
    .transform((v) =>
      v
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean)
        .slice(0, 6),
    ),
  avatarUrl: z.string().url().max(500).optional().or(z.literal('')),
  rating: optionalNumeric.pipe(z.number().int().min(1, 'Use 1 to 5').max(5, 'Use 1 to 5').optional()),
  /** Date the customer approved the quote and photo in writing. Required before approval. */
  consentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal('')),
  approved: z.boolean(),
  sortOrder: numeric.pipe(z.number().int().min(0).max(999)),
}).refine((t) => !t.approved || Boolean(t.consentDate), {
  message: 'Record the date the customer gave written consent before approving',
  path: ['consentDate'],
})

export type MetricInput = z.input<typeof MetricSchema>
export type TestimonialInput = z.input<typeof TestimonialSchema>

/** Optional text field: trimmed, empty means "use the default" (stored as null). */
function overrideText(max: number, min = 1) {
  return z
    .string()
    .max(max, `Keep it under ${max} characters`)
    .transform((v) => v.trim())
    .refine((v) => v === '' || v.length >= min, `Use at least ${min} characters, or leave it empty`)
    .refine((v) => !/[<>]/.test(v), 'Remove < and >; HTML is not allowed')
    // Any spelling other than the exact brand ("viewixsoft", "ViewixSoft"…) is rejected.
    .refine((v) => !/viewixsoft/i.test(v.replace(/Viewixsoft/g, '')), 'Write the brand as "Viewixsoft"')
    .transform((v) => (v === '' ? null : v))
}

const pageKeys = ADMIN_PAGES.map((p) => p.key) as [string, ...string[]]

/** Hero and search snippet overrides for one page (see src/data/page-content.ts). */
export const PageOverrideSchema = z.object({
  key: z.enum(pageKeys),
  heroEyebrow: overrideText(40),
  heroTitle: overrideText(120, 3),
  heroHighlight: overrideText(80),
  heroDescription: overrideText(400, 10),
  seoTitle: overrideText(120, 10).refine(
    (v) => v === null || buildTitle(v).length <= TITLE_MAX,
    `With " — Viewixsoft" added the title must fit in ${TITLE_MAX} characters`,
  ),
  seoDescription: overrideText(DESCRIPTION_MAX, 50),
})

export type PageOverrideInput = z.input<typeof PageOverrideSchema>
