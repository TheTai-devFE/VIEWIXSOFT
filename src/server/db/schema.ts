import { sql } from 'drizzle-orm'
import type { Json } from '~/lib/section-content'
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
// Relative import: drizzle-kit loads this file without the ~/ alias.
import { LEAD_STATUSES, LEAD_TYPES, PRODUCT_STATUSES } from '../../lib/enums'
import { CASE_STUDY_MODES } from '../../lib/case-study'
import type {
  CaseStudyResult,
  ContentSection,
  FaqEntry,
  Highlight,
  Reviewer,
  SetupItem,
  Story,
} from '../../lib/case-study'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}

// ─── Leads ────────────────────────────────────────────────────────────────────


export const leads = pgTable(
  'leads',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    type: text('type', { enum: LEAD_TYPES }).notNull().default('demo'),
    name: text('name').notNull(),
    email: text('email').notNull(),
    company: text('company').notNull(),
    jobTitle: text('job_title'),
    country: text('country').notNull(),
    phone: text('phone'),
    companySize: text('company_size'),
    screenCount: text('screen_count'),
    products: text('products').array().notNull().default(sql`'{}'::text[]`),
    message: text('message').notNull(),
    consent: boolean('consent').notNull(),
    consentAt: timestamp('consent_at', { withTimezone: true }).notNull(),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    utmTerm: text('utm_term'),
    utmContent: text('utm_content'),
    referrer: text('referrer'),
    landingPage: text('landing_page'),
    ipHash: text('ip_hash'),
    userAgent: text('user_agent'),
    status: text('status', { enum: LEAD_STATUSES }).notNull().default('new'),
    notes: text('notes'),
    ...timestamps,
  },
  (t) => [
    index('leads_created_at_idx').on(t.createdAt),
    // Rate limiting looks up recent submissions by IP hash and by email.
    index('leads_ip_hash_created_at_idx').on(t.ipHash, t.createdAt),
    index('leads_email_created_at_idx').on(t.email, t.createdAt),
  ],
)

export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  /** Empty for the general newsletter; a product slug for a launch notification. */
  topics: text('topics').array().notNull().default(sql`'{}'::text[]`),
  status: text('status', { enum: ['pending', 'active', 'unsubscribed'] }).notNull().default('pending'),
  consentAt: timestamp('consent_at', { withTimezone: true }).notNull(),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  ...timestamps,
})

export type Lead = typeof leads.$inferSelect
export type NewLead = typeof leads.$inferInsert
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect

// ─── Better Auth (field names follow better-auth's core schema) ───────────────

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  // Better Auth admin plugin. 'admin' can do everything; 'user' only what `permissions` lists.
  role: text('role').notNull().default('user'),
  banned: boolean('banned').notNull().default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires', { withTimezone: true }),
  /** Admin modules a 'user' may open; see ~/lib/permissions. */
  permissions: text('permissions').array().notNull().default(sql`'{}'::text[]`),
})

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    // Required by the Better Auth admin plugin; impersonation itself is turned off.
    impersonatedBy: text('impersonated_by'),
  },
  (t) => [index('session_user_id_idx').on(t.userId)],
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('account_user_id_idx').on(t.userId)],
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('verification_identifier_idx').on(t.identifier)],
)

// ─── Site settings (edited in /admin/site) ────────────────────────────────────

/** One row per section a page shows; missing rows fall back to the registry defaults. */
export const sectionSettings = pgTable(
  'section_settings',
  {
    page: text('page').notNull(),
    sectionKey: text('section_key').notNull(),
    enabled: boolean('enabled').notNull(),
    sortOrder: integer('sort_order').notNull(),
    updatedBy: text('updated_by'),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.page, t.sectionKey] })],
)

/** Release state per product; overrides the default in src/content/products.ts. */
export const productSettings = pgTable('product_settings', {
  slug: text('slug').primaryKey(),
  status: text('status', { enum: PRODUCT_STATUSES }).notNull(),
  updatedBy: text('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

/** Public business figures. Source and date are required (AGENTS.md §9). */
export const siteMetrics = pgTable('site_metrics', {
  key: text('key').primaryKey(),
  value: integer('value').notNull(),
  source: text('source').notNull(),
  asOf: date('as_of').notNull(),
  updatedBy: text('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

/** Customer quotes. Only `approved` rows with recorded consent are shown. */
export const testimonials = pgTable('testimonials', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  company: text('company').notNull(),
  quote: text('quote').notNull(),
  uses: text('uses').array().notNull().default(sql`'{}'::text[]`),
  avatarUrl: text('avatar_url'),
  rating: integer('rating'),
  approved: boolean('approved').notNull().default(false),
  consentAt: timestamp('consent_at', { withTimezone: true }),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
})

/** An image uploaded to the library in /admin/media. Pages pick from these. */
export const mediaAssets = pgTable('media_assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  url: text('url').notNull(),
  storageKey: text('storage_key').notNull().unique(),
  fileName: text('file_name').notNull(),
  contentType: text('content_type').notNull(),
  /** Null for files moved in from the old per-slot uploads, whose size was not recorded. */
  bytes: integer('bytes'),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  /** Suggested alt text, from the file name; each placement sets its own. */
  alt: text('alt').notNull(),
  uploadedBy: text('uploaded_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

/**
 * Which library image fills a named slot (see src/data/media-slots.ts), with
 * the alt text for that place. A slot without a row shows its default.
 * `restrict` keeps an image that is in use from being deleted.
 */
export const mediaSlots = pgTable('media_slots', {
  key: text('key').primaryKey(),
  assetId: uuid('asset_id')
    .notNull()
    .references(() => mediaAssets.id, { onDelete: 'restrict' }),
  alt: text('alt').notNull(),
  updatedBy: text('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

/**
 * Edited content of one section (see src/lib/section-content.ts), replacing
 * its defaults from the code as a whole. `page` is a SECTION_PAGES key.
 */
export const sectionContent = pgTable(
  'section_content',
  {
    page: text('page').notNull(),
    sectionKey: text('section_key').notNull(),
    content: jsonb('content').$type<Json>().notNull(),
    updatedBy: text('updated_by'),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.page, t.sectionKey] })],
)

/**
 * Admin overrides of a page's search snippet (/admin/seo), keyed like
 * /admin/pages/<key>. Null or empty fields fall back to src/data/page-content.ts.
 * The hero_* columns are no longer edited or read.
 */
export const pageOverrides = pgTable('page_overrides', {
  key: text('key').primaryKey(),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  heroEyebrow: text('hero_eyebrow'),
  heroTitle: text('hero_title'),
  heroHighlight: text('hero_highlight'),
  heroDescription: text('hero_description'),
  updatedBy: text('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export type PageOverrideRow = typeof pageOverrides.$inferSelect
export type Testimonial = typeof testimonials.$inferSelect
export type SiteMetric = typeof siteMetrics.$inferSelect
export type MediaSlotRow = typeof mediaSlots.$inferSelect
export type MediaAssetRow = typeof mediaAssets.$inferSelect

// ─── Dynamic Blog Posts & Use Cases (Edited in /admin/blog & /admin/use-cases) ──

export const AUTHOR_KINDS = ['person', 'organization'] as const

/**
 * Blog bylines. A named person with a role, a short bio, a photo and a
 * profile link is what Google and answer engines read as E-E-A-T; an
 * `organization` byline is published as the Organization in JSON-LD.
 */
export const authors = pgTable('authors', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull().default(''),
  bio: text('bio').notNull().default(''),
  avatarUrl: text('avatar_url'),
  /** LinkedIn or another public profile, published as `sameAs`. */
  profileUrl: text('profile_url'),
  kind: text('kind', { enum: AUTHOR_KINDS }).notNull().default('person'),
  /** The admin account that writes as this author, if any: its new posts get this byline. */
  userId: text('user_id')
    .unique()
    .references(() => user.id, { onDelete: 'set null' }),
  ...timestamps,
})

export const blogPosts = pgTable(
  'blog_posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    seoTitle: text('seo_title'),
    description: text('description').notNull(),
    content: text('content').notNull().default(''),
    coverUrl: text('cover_url'),
    coverAlt: text('cover_alt'),
    category: text('category').notNull().default('General'),
    product: text('product').notNull().default('cms'),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    authorId: uuid('author_id').references(() => authors.id, { onDelete: 'set null' }),
    // The byline used before authors had profiles; still shown when no author is picked.
    authorName: text('author_name').notNull().default('Viewixsoft Team'),
    authorRole: text('author_role').default('Editorial Team'),
    keyTakeaways: text('key_takeaways').array().notNull().default(sql`'{}'::text[]`),
    /** Search snippet; the summary is used, shortened, when this is empty. */
    seoDescription: text('seo_description'),
    faq: jsonb('faq').$type<FaqEntry[]>().notNull().default(sql`'[]'::jsonb`),
    /** Who created the post (owns it) and who saved it last; kept when the account is deleted. */
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
    status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index('blog_posts_slug_idx').on(t.slug),
    index('blog_posts_status_idx').on(t.status),
    index('blog_posts_created_by_idx').on(t.createdBy),
    index('blog_posts_published_at_idx').on(t.publishedAt),
  ],
)

export const useCases = pgTable(
  'use_cases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    seoTitle: text('seo_title'),
    industry: text('industry').notNull(),
    tagline: text('tagline').notNull(),
    coverUrl: text('cover_url'),
    coverAlt: text('cover_alt'),
    // Superseded by `sections`; rows written before it are read as two sections (see use-case-from-row).
    challengeHeading: text('challenge_heading').notNull().default('What was the challenge?'),
    challenge: text('challenge').notNull().default(''),
    solutionHeading: text('solution_heading').notNull().default('How did Viewixsoft solve it?'),
    solution: text('solution').notNull().default(''),
    results: jsonb('results').$type<CaseStudyResult[]>().notNull().default(sql`'[]'::jsonb`),
    quote: jsonb('quote').$type<{ text: string; author: string; title: string; company: string } | null>(),
    featuredProducts: jsonb('featured_products').$type<{ name: string; slug: string }[]>().notNull().default(sql`'[]'::jsonb`),
    // Page blocks; shapes and meaning in src/lib/case-study.ts.
    mode: text('mode', { enum: CASE_STUDY_MODES }).notNull().default('guide'),
    highlights: jsonb('highlights').$type<Highlight[]>().notNull().default(sql`'[]'::jsonb`),
    sections: jsonb('sections').$type<ContentSection[]>().notNull().default(sql`'[]'::jsonb`),
    setup: jsonb('setup').$type<SetupItem[]>().notNull().default(sql`'[]'::jsonb`),
    stories: jsonb('stories').$type<Story[]>().notNull().default(sql`'[]'::jsonb`),
    faq: jsonb('faq').$type<FaqEntry[]>().notNull().default(sql`'[]'::jsonb`),
    reviewedBy: jsonb('reviewed_by').$type<Reviewer | null>(),
    /** Who created the post (owns it) and who saved it last; kept when the account is deleted. */
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
    status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index('use_cases_slug_idx').on(t.slug),
    index('use_cases_status_idx').on(t.status),
    index('use_cases_created_by_idx').on(t.createdBy),
    index('use_cases_published_at_idx').on(t.publishedAt),
  ],
)

/** What admin accounts did, for /admin/activity. Rows older than 90 days are pruned. */
export const activityLog = pgTable(
  'activity_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorId: text('actor_id').references(() => user.id, { onDelete: 'set null' }),
    /** The name at the time, so the entry still reads after the account is deleted. */
    actorName: text('actor_name').notNull(),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    /** A title or name to show; never a lead's or subscriber's contact details. */
    entityLabel: text('entity_label'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('activity_log_created_at_idx').on(t.createdAt),
    index('activity_log_actor_id_idx').on(t.actorId),
  ],
)

export type ActivityRow = typeof activityLog.$inferSelect
export type AuthorRow = typeof authors.$inferSelect
export type BlogPostRow = typeof blogPosts.$inferSelect
export type NewBlogPost = typeof blogPosts.$inferInsert
export type UseCaseRow = typeof useCases.$inferSelect
export type NewUseCase = typeof useCases.$inferInsert

