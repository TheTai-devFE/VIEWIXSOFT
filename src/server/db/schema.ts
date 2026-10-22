import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core'

export const leads = pgTable('leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: text('type').notNull().default('demo'), // 'contact' | 'demo' | 'newsletter'
  name: text('name').notNull(),
  email: text('email').notNull(),
  company: text('company').notNull(),
  jobTitle: text('job_title'),
  country: text('country').notNull(),
  phone: text('phone'),
  companySize: text('company_size'),
  screenCount: text('screen_count'),
  products: text('products').array(),
  message: text('message').notNull(),
  consent: boolean('consent').notNull().default(false),
  consentAt: timestamp('consent_at').defaultNow(),
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  utmTerm: text('utm_term'),
  utmContent: text('utm_content'),
  referrer: text('referrer'),
  landingPage: text('landing_page'),
  ipHash: text('ip_hash'),
  userAgent: text('user_agent'),
  status: text('status').notNull().default('new'), // 'new' | 'contacted' | 'qualified' | 'won' | 'lost' | 'spam'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  status: text('status').notNull().default('pending'), // 'pending' | 'active' | 'unsubscribed'
  confirmedAt: timestamp('confirmed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type Lead = typeof leads.$inferSelect
export type NewLead = typeof leads.$inferInsert
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect
