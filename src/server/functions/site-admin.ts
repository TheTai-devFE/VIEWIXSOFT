import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  MetricSchema,
  PageOverrideSchema,
  SaveProductStatusSchema,
  SaveSectionsSchema,
  TestimonialSchema,
} from '~/lib/admin-schemas'
import { ADMIN_PAGES } from '~/data/admin-pages'
import { METRIC_DEFS } from '~/data/site-sections'
import { adminMiddleware } from '~/server/functions/admin-middleware'
import { errorFields, logger } from '~/server/logger'
import { invalidateSiteConfig } from '~/server/site/config'
import {
  deleteMetric,
  deletePageOverride,
  deleteTestimonial,
  readAdminSiteData,
  saveMetric,
  savePageOverride,
  saveProductStatus,
  saveSections,
  saveTestimonial,
} from '~/server/site/repository'

type Saved = { ok: true } | { ok: false; error: string }

/** Runs a write, refreshes the cached site settings and hides DB errors from the browser. */
async function write(event: string, fn: () => Promise<unknown>): Promise<Saved> {
  try {
    await fn()
    invalidateSiteConfig()
    logger.info(event)
    return { ok: true }
  } catch (error) {
    logger.error(`${event}_failed`, errorFields(error))
    return { ok: false, error: 'Saving failed. Try again, and check the server logs if it keeps failing.' }
  }
}

export const getSiteAdminDataFn = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () => {
    try {
      const data = await readAdminSiteData()
      return {
        ok: true as const,
        ...data,
        testimonials: data.testimonials.map((t) => ({
          ...t,
          consentDate: t.consentAt ? t.consentAt.toISOString().slice(0, 10) : '',
        })),
      }
    } catch (error) {
      logger.error('admin.site_data_failed', errorFields(error))
      return { ok: false as const }
    }
  })

export const saveSectionsFn = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator((data: unknown) => SaveSectionsSchema.parse(data))
  .handler(({ data, context }) => write('admin.sections_saved', () => saveSections(data, context.admin.email)))

export const saveProductStatusFn = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator((data: unknown) => SaveProductStatusSchema.parse(data))
  .handler(({ data, context }) => write('admin.product_status_saved', () => saveProductStatus(data, context.admin.email)))

export const saveMetricFn = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator((data: unknown) => MetricSchema.parse(data))
  .handler(({ data, context }) => write('admin.metric_saved', () => saveMetric(data, context.admin.email)))

export const deleteMetricFn = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator((data: unknown) => z.object({ key: z.enum(METRIC_DEFS.map((m) => m.key) as [string, ...string[]]) }).parse(data))
  .handler(({ data }) => write('admin.metric_deleted', () => deleteMetric(data.key)))

export const saveTestimonialFn = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator((data: unknown) => TestimonialSchema.parse(data))
  .handler(({ data }) => write('admin.testimonial_saved', () => saveTestimonial(data)))

export const deleteTestimonialFn = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(({ data }) => write('admin.testimonial_deleted', () => deleteTestimonial(data.id)))

export const savePageOverrideFn = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator((data: unknown) => PageOverrideSchema.parse(data))
  .handler(({ data, context }) => write('admin.page_saved', () => savePageOverride(data, context.admin.email)))

/** Back to the default hero and search text from the code. */
export const resetPageOverrideFn = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator((data: unknown) => z.object({ key: z.enum(ADMIN_PAGES.map((p) => p.key) as [string, ...string[]]) }).parse(data))
  .handler(({ data }) => write('admin.page_reset', () => deletePageOverride(data.key)))
