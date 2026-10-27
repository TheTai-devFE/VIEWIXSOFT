import { z } from 'zod'
import { CaseStudyBlocksSchema, FaqEntrySchema, ResultSchema, storyProblems } from '~/lib/case-study'
import { PRODUCTS } from '~/content/products'
import { METRIC_DEFS, SECTION_PAGES, SECTION_PAGE_KEYS } from '~/data/site-sections'
import type { SectionPage } from '~/data/site-sections'
import { PRODUCT_STATUSES } from '~/lib/enums'
import { ADMIN_PAGES } from '~/data/admin-pages'
import { MEDIA_SLOT_KEYS } from '~/data/media-slots'
import { buildTitle, DESCRIPTION_MAX, TITLE_MAX } from '~/lib/seo/meta'
import { PERMISSIONS, PermissionSchema, ROLES } from '~/lib/permissions'

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

/** Search snippet overrides for one page (see src/data/page-content.ts). */
export const PageOverrideSchema = z.object({
  key: z.enum(pageKeys),
  seoTitle: overrideText(120, 10).refine(
    (v) => v === null || buildTitle(v).length <= TITLE_MAX,
    `With " — Viewixsoft" added the title must fit in ${TITLE_MAX} characters`,
  ),
  seoDescription: overrideText(DESCRIPTION_MAX, 50),
})

export type PageOverrideInput = z.input<typeof PageOverrideSchema>

export const MediaAltSchema = z.string().trim().min(3, 'Describe the image in a few words').max(200)

/** A page's image picks from /admin/pages; a null image puts the slot back to its default. */
export const SaveMediaSlotsSchema = z.object({
  changes: z
    .array(
      z.object({
        key: z.enum(MEDIA_SLOT_KEYS as [string, ...string[]]),
        assetId: z.string().uuid().nullable(),
        alt: z.string().trim().max(200),
      }),
    )
    .min(1)
    .max(50)
    .superRefine((changes, ctx) => {
      changes.forEach((c, i) => {
        if (c.assetId && MediaAltSchema.safeParse(c.alt).error) {
          ctx.addIssue({ code: 'custom', path: [i, 'alt'], message: 'Describe the image in a few words' })
        }
      })
    }),
})

export type SaveMediaSlotsInput = z.input<typeof SaveMediaSlotsSchema>

// ─── Blog Post & Use Case Admin Schemas ────────────────────────────────────────

/** An author profile in /admin/authors. Messages are admin UI copy (Vietnamese, AGENTS.md §0.6). */
export const AuthorFormSchema = z.object({
  name: z.string().trim().min(2, 'Tên tác giả cần ít nhất 2 ký tự').max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ gồm chữ thường, số và dấu gạch ngang'),
  role: z.string().trim().max(100).default(''),
  bio: z.string().trim().max(600, 'Giới thiệu tối đa 600 ký tự').default(''),
  avatarUrl: z.string().trim().max(500).optional(),
  profileUrl: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === '' || /^https:\/\//.test(v), 'Link hồ sơ phải bắt đầu bằng https://')
    .optional(),
  kind: z.enum(['person', 'organization']).default('person'),
  /** Admin account that writes as this author; '' or null for none. */
  userId: z
    .string()
    .trim()
    .max(64)
    .nullish()
    .transform((v) => v || null),
})

export type AuthorFormInput = z.infer<typeof AuthorFormSchema>

export const BlogPostFormSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(160),
  slug: z
    .string()
    .trim()
    .min(3, 'Slug must be at least 3 characters')
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens (e.g. my-post-title)'),
  seoTitle: z.string().trim().max(120).optional(),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(600, 'Description must not exceed 600 characters'),
  content: z.string().trim().min(10, 'Content must be at least 10 characters'),
  coverUrl: z.string().trim().optional(),
  coverAlt: z.string().trim().max(200).optional(),
  category: z.string().trim().min(2).max(60).default('General'),
  product: z.enum(['cms', 'pos', 'tracking', 'nfc']).default('cms'),
  tags: z.array(z.string().trim().min(1).max(40)).default([]),
  authorId: z.string().uuid().nullable().optional(),
  authorName: z.string().trim().min(2).max(100).default('Viewixsoft Team'),
  authorRole: z.string().trim().max(100).optional(),
  keyTakeaways: z.array(z.string().trim().min(3).max(300)).default([]),
  seoDescription: z.string().trim().max(160).optional(),
  faq: z.array(FaqEntrySchema).max(8).default([]),
  status: z.enum(['draft', 'published']).default('draft'),
})

export type BlogPostFormInput = z.infer<typeof BlogPostFormSchema>

export const UseCaseFormSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(160),
  slug: z
    .string()
    .trim()
    .min(3, 'Slug must be at least 3 characters')
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  seoTitle: z.string().trim().max(120).optional(),
  industry: z.string().trim().min(2, 'Industry is required').max(60),
  tagline: z.string().trim().min(5, 'Tagline is required').max(250),
  coverUrl: z.string().trim().optional(),
  coverAlt: z.string().trim().max(200).optional(),
  results: z.array(ResultSchema).max(3).default([]),
  quote: z
    .object({
      text: z.string().trim().min(5).max(1000),
      author: z.string().trim().min(2).max(100),
      title: z.string().trim().min(2).max(100),
      company: z.string().trim().min(2).max(120),
    })
    .nullable()
    .optional(),
  featuredProducts: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        slug: z.string().trim().min(1),
      }),
    )
    .default([]),
  status: z.enum(['draft', 'published']).default('draft'),
})
  .merge(CaseStudyBlocksSchema)
  .superRefine((data, ctx) => {
    for (const message of storyProblems(data)) ctx.addIssue({ code: 'custom', path: ['results'], message })
  })

export type UseCaseFormInput = z.infer<typeof UseCaseFormSchema>

export const FooterSettingsSchema = z.object({
  legalEntity: z.object({
    name: z.string().trim().min(1, 'Company name is required'),
    businessRegistrationNo: z.string().trim().min(1, 'Registration number is required'),
    addressLines: z.array(z.string().trim()).min(1, 'At least one address line is required'),
    hotline: z.string().trim().optional().default(''),
  }),
  contacts: z.array(
    z.object({
      department: z.string().trim().min(1, 'Department is required'),
      email: z.string().trim(),
      phone: z.string().trim().optional().default(''),
    }),
  ),
  socials: z.array(
    z.object({
      network: z.enum(['facebook', 'tiktok', 'linkedin', 'x', 'youtube']),
      label: z.string(),
      url: z.string().trim(),
    }),
  ),
  copyright: z.string().trim().min(1, 'Copyright is required'),
  companyLinks: z
    .array(
      z.object({
        label: z.string().trim().min(1, 'Label is required'),
        to: z.string().trim().min(1, 'Path is required'),
      }),
    )
    .optional(),
  legalLinks: z
    .array(
      z.object({
        label: z.string().trim().min(1, 'Label is required'),
        to: z.string().trim().min(1, 'Path is required'),
      }),
    )
    .optional(),
})

export type FooterSettings = z.infer<typeof FooterSettingsSchema>

export const PageVisibilitySchema = z.record(z.string(), z.boolean())
export type PageVisibilityInput = z.infer<typeof PageVisibilitySchema>


// Accounts in /admin/users. Messages are admin UI copy, so they are in Vietnamese.
export const PASSWORD_MIN = 12

export const PasswordSchema = z
  .string()
  .min(PASSWORD_MIN, `Mật khẩu cần ít nhất ${PASSWORD_MIN} ký tự`)
  .max(128, 'Mật khẩu tối đa 128 ký tự')

export const UserAccessSchema = z.object({
  role: z.enum(ROLES),
  permissions: z.array(PermissionSchema).max(PERMISSIONS.length),
})

export const UserCreateSchema = UserAccessSchema.extend({
  name: z.string().trim().min(1, 'Nhập tên').max(120),
  email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
  password: PasswordSchema,
})
export type UserCreateInput = z.infer<typeof UserCreateSchema>

export const UserUpdateSchema = UserAccessSchema.extend({
  userId: z.string().min(1),
  name: z.string().trim().min(1, 'Nhập tên').max(120),
})
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>
