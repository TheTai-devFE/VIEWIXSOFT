import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  MetricSchema,
  PageOverrideSchema,
  SaveProductStatusSchema,
  SaveSectionsSchema,
  TestimonialSchema,
} from '~/lib/admin-schemas'
import { METRIC_DEFS } from '~/data/site-sections'
import { assetIdsIn, SECTION_CONTENT, SECTION_CONTENT_KEYS } from '~/lib/section-content'
import type { Json, SectionContentKey } from '~/lib/section-content'
import { adminMiddleware } from '~/server/functions/admin-middleware'
import { errorFields, logger } from '~/server/logger'
import { invalidateSiteConfig } from '~/server/site/config'
import { isVideoAsset } from '~/data/media-slots'
import { getAssetsByIds } from '~/server/media/repository'
import { getStorage } from '~/server/media/storage'
import {
  deleteMetric,
  deleteSectionContent,
  deleteTestimonial,
  listSectionContent,
  readAdminSiteData,
  saveMetric,
  savePageOverride,
  saveProductStatus,
  saveSectionContent,
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

/** Image slots a section's content replaces; cleared once that section is saved. */
const REPLACED_SLOTS: Partial<Record<SectionContentKey, string>> = { 'home:devices': 'hardware.' }

/** Saves one section's content from /admin/pages; `content: null` goes back to the defaults. */
export const saveSectionContentFn = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator((data: unknown) => {
    const { key, content } = z
      .object({ key: z.enum(SECTION_CONTENT_KEYS as [SectionContentKey, ...SectionContentKey[]]), content: z.unknown() })
      .parse(data)
    return { key, content: content === null ? null : SECTION_CONTENT[key].schema.parse(content) }
  })
  .handler(async ({ data, context }): Promise<Saved> => {
    const [page = '', sectionKey = ''] = data.key.split(':')
    const before = await storageKeysOf(page, sectionKey)
    if (data.content === null) {
      const saved = await write('admin.section_content_reset', () =>
        deleteSectionContent(page, sectionKey, REPLACED_SLOTS[data.key]),
      )
      if (saved.ok) await removeFiles(before, [])
      return saved
    }

    // Url and size come from the library, never from the browser.
    const ids = assetIdsIn(data.content)
    const assets = new Map((await getAssetsByIds(ids)).map((a) => [a.id, a]))
    if (assets.size !== ids.length) return { ok: false, error: 'An image was deleted from the library. Pick it again.' }
    // Storage is looked up only for sections with uploads, so other sections save without R2.
    let storage: ReturnType<typeof getStorage> | undefined
    const urlFor = (key: string) => (storage ??= getStorage()).urlFor(key)
    let content: Json
    let wrongKind = false
    try {
      content = JSON.parse(JSON.stringify(data.content), (field, v: unknown) => {
        if (!v || typeof v !== 'object') return v
        // Uploaded captions: the url always follows the storage key.
        if ('storageKey' in v && typeof v.storageKey === 'string') return { ...v, url: urlFor(v.storageKey) }
        if (!('assetId' in v) || typeof v.assetId !== 'string') return v
        const a = assets.get(v.assetId)
        if (!a) return v
        // Fields named `video` take library videos; every other place takes images.
        if ((field === 'video') !== isVideoAsset(a)) wrongKind = true
        const filled = { ...v, url: a.url, width: a.width, height: a.height }
        return field === 'video' ? { ...filled, uploadedAt: a.createdAt.toISOString().slice(0, 10) } : filled
      }) as Json
    } catch (error) {
      logger.error('admin.section_content_save_failed', errorFields(error))
      return { ok: false, error: 'File storage is not configured. Check the R2 settings.' }
    }
    if (wrongKind) return { ok: false, error: 'A video was picked where an image belongs, or the other way round. Pick again.' }

    const saved = await write('admin.section_content_saved', () =>
      saveSectionContent(page, sectionKey, content, context.admin.email, REPLACED_SLOTS[data.key]),
    )
    // A replaced or removed upload is no longer shown anywhere, so its file goes too.
    if (saved.ok) await removeFiles(before, storageKeysIn(content))
    return saved
  })

/** Storage keys of uploaded files in a piece of section content. */
function storageKeysIn(content: unknown): string[] {
  return [...JSON.stringify(content ?? null).matchAll(/"storageKey":"(media\/[a-z0-9/.-]+)"/g)].flatMap((m) => (m[1] ? [m[1]] : []))
}

async function storageKeysOf(page: string, sectionKey: string) {
  const rows = await listSectionContent().catch(() => [])
  return storageKeysIn(rows.find((r) => r.page === page && r.sectionKey === sectionKey)?.content)
}

async function removeFiles(before: string[], after: string[]) {
  const gone = before.filter((k) => !after.includes(k))
  if (!gone.length) return
  try {
    const storage = getStorage()
    await Promise.all(gone.map((k) => storage.remove(k).catch(() => undefined)))
  } catch (error) {
    logger.error('admin.upload_cleanup_failed', errorFields(error))
  }
}
