import '@tanstack/react-start/server-only'
import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '~/server/db/client'
import { pageOverrides, productSettings, sectionSettings, siteMetrics, testimonials } from '~/server/db/schema'
import { SECTION_PAGES } from '~/data/site-sections'
import type {
  MetricSchema,
  PageOverrideSchema,
  SaveProductStatusSchema,
  SaveSectionsSchema,
  TestimonialSchema,
} from '~/lib/admin-schemas'

export async function readAdminSiteData() {
  const db = getDb()
  const [sections, products, metrics, quotes, pages] = await Promise.all([
    db.select().from(sectionSettings),
    db.select().from(productSettings),
    db.select().from(siteMetrics),
    db.select().from(testimonials).orderBy(asc(testimonials.sortOrder), asc(testimonials.createdAt)),
    db.select().from(pageOverrides),
  ])
  return { sections, products, metrics, testimonials: quotes, pages }
}

export async function saveSections(input: z.output<typeof SaveSectionsSchema>, by: string) {
  const locked = new Set<string>(
    SECTION_PAGES[input.page].sections.filter((s) => 'locked' in s && s.locked).map((s) => s.key),
  )
  const rows = input.sections.map((s) => ({
    page: input.page,
    sectionKey: s.key,
    enabled: locked.has(s.key) || s.enabled,
    sortOrder: s.sortOrder,
    updatedBy: by,
  }))
  const db = getDb()
  // One batch = one transaction on Neon's HTTP driver: the page never ends up half-saved.
  const clear = db.delete(sectionSettings).where(eq(sectionSettings.page, input.page))
  if (rows.length) await db.batch([clear, db.insert(sectionSettings).values(rows)])
  else await clear
}

export async function saveProductStatus(input: z.output<typeof SaveProductStatusSchema>, by: string) {
  await getDb()
    .insert(productSettings)
    .values({ slug: input.slug, status: input.status, updatedBy: by })
    .onConflictDoUpdate({ target: productSettings.slug, set: { status: input.status, updatedBy: by } })
}

export async function saveMetric(input: z.output<typeof MetricSchema>, by: string) {
  const values = { value: input.value, source: input.source, asOf: input.asOf, updatedBy: by }
  await getDb()
    .insert(siteMetrics)
    .values({ key: input.key, ...values })
    .onConflictDoUpdate({ target: siteMetrics.key, set: values })
}

export async function deleteMetric(key: string) {
  await getDb().delete(siteMetrics).where(eq(siteMetrics.key, key))
}

export async function saveTestimonial(input: z.output<typeof TestimonialSchema>) {
  const values = {
    name: input.name,
    role: input.role,
    company: input.company,
    quote: input.quote,
    uses: input.uses,
    avatarUrl: input.avatarUrl || null,
    rating: input.rating ?? null,
    consentAt: input.consentDate ? new Date(`${input.consentDate}T00:00:00Z`) : null,
    approved: input.approved,
    sortOrder: input.sortOrder,
  }
  const db = getDb()
  if (input.id) {
    const [row] = await db.update(testimonials).set(values).where(eq(testimonials.id, input.id)).returning()
    return row
  }
  const [row] = await db.insert(testimonials).values(values).returning()
  return row
}

export async function deleteTestimonial(id: string) {
  await getDb().delete(testimonials).where(eq(testimonials.id, id))
}

/** Saves a page's overrides; a page with every field empty is removed instead. */
export async function savePageOverride(input: z.output<typeof PageOverrideSchema>, by: string) {
  const { key, ...fields } = input
  const db = getDb()
  if (Object.values(fields).every((v) => v === null)) {
    await db.delete(pageOverrides).where(eq(pageOverrides.key, key))
    return
  }
  const values = { ...fields, updatedBy: by }
  await db.insert(pageOverrides).values({ key, ...values }).onConflictDoUpdate({ target: pageOverrides.key, set: values })
}

export async function deletePageOverride(key: string) {
  await getDb().delete(pageOverrides).where(eq(pageOverrides.key, key))
}
