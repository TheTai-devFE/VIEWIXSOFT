import { sql } from 'drizzle-orm'
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
// Relative import: drizzle-kit loads this file without the ~/ alias.
import { LEAD_STATUSES, LEAD_TYPES, PRODUCT_STATUSES } from '../../lib/enums'

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

/** Image override for a named slot (see src/data/media-slots.ts). */
export const mediaSlots = pgTable('media_slots', {
  key: text('key').primaryKey(),
  url: text('url').notNull(),
  storageKey: text('storage_key').notNull(),
  alt: text('alt').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  updatedBy: text('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export type Testimonial = typeof testimonials.$inferSelect
export type SiteMetric = typeof siteMetrics.$inferSelect
export type MediaSlotRow = typeof mediaSlots.$inferSelect
