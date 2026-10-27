import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  FooterSettingsSchema,
  MetricSchema,
  PageOverrideSchema,
  PageVisibilitySchema,
  SaveProductStatusSchema,
  SaveSectionsSchema,
  TestimonialSchema,
} from '~/lib/admin-schemas'
import type { FooterSettings } from '~/lib/admin-schemas'
import { FOOTER_CONFIG } from '~/data/footer'
import { METRIC_DEFS } from '~/data/site-sections'
import { assetIdsIn, SECTION_CONTENT, SECTION_CONTENT_KEYS } from '~/lib/section-content'
import type { Json, SectionContentKey } from '~/lib/section-content'
import { requirePermission } from '~/server/functions/admin-middleware'
import { errorFields, logger } from '~/server/logger'
import { logActivity } from '~/server/activity/repository'
import type { Actor, ActivityTarget } from '~/server/activity/repository'
import type { ActivityAction } from '~/lib/activity'
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
/** An activity entry to record once the write succeeds. */
type Activity = [Actor, ActivityAction, ActivityTarget]

async function write(event: string, fn: () => Promise<unknown>, activity?: Activity): Promise<Saved> {
  try {
    await fn()
    invalidateSiteConfig()
    logger.info(event)
    if (activity) await logActivity(...activity)
    return { ok: true }
  } catch (error) {
    logger.error(`${event}_failed`, errorFields(error))
    return { ok: false, error: 'Saving failed. Try again, and check the server logs if it keeps failing.' }
  }
}

export const getSiteAdminDataFn = createServerFn({ method: 'GET' })
  .middleware([requirePermission('pages', 'seo', 'products', 'stats', 'testimonials')])
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
  .middleware([requirePermission('pages')])
  .validator((data: unknown) => SaveSectionsSchema.parse(data))
  .handler(({ data, context }) => write('admin.sections_saved', () => saveSections(data, context.admin.email), [context.admin, 'page.update', { type: 'page', id: data.page, label: `Thứ tự & ẩn/hiện section: ${data.page}` }]))

export const saveProductStatusFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('products')])
  .validator((data: unknown) => SaveProductStatusSchema.parse(data))
  .handler(({ data, context }) => write('admin.product_status_saved', () => saveProductStatus(data, context.admin.email), [context.admin, 'product.status', { type: 'product', id: data.slug, label: `${data.slug}: ${data.status}` }]))

export const saveMetricFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('stats')])
  .validator((data: unknown) => MetricSchema.parse(data))
  .handler(({ data, context }) => write('admin.metric_saved', () => saveMetric(data, context.admin.email), [context.admin, 'stat.update', { type: 'stat', id: data.key, label: data.key }]))

export const deleteMetricFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('stats')])
  .validator((data: unknown) => z.object({ key: z.enum(METRIC_DEFS.map((m) => m.key) as [string, ...string[]]) }).parse(data))
  .handler(({ data, context }) =>
    write('admin.metric_deleted', () => deleteMetric(data.key), [context.admin, 'stat.delete', { type: 'stat', id: data.key, label: data.key }]),
  )

export const saveTestimonialFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('testimonials')])
  .validator((data: unknown) => TestimonialSchema.parse(data))
  .handler(({ data, context }) =>
    write('admin.testimonial_saved', () => saveTestimonial(data), [
      context.admin,
      'id' in data && data.id ? 'testimonial.update' : 'testimonial.create',
      { type: 'testimonial', label: data.name },
    ]),
  )

export const deleteTestimonialFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('testimonials')])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(({ data, context }) =>
    write('admin.testimonial_deleted', () => deleteTestimonial(data.id), [context.admin, 'testimonial.delete', { type: 'testimonial', id: data.id }]),
  )

export const savePageOverrideFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('pages', 'seo')])
  .validator((data: unknown) => PageOverrideSchema.parse(data))
  .handler(({ data, context }) => write('admin.page_saved', () => savePageOverride(data, context.admin.email), [context.admin, 'seo.update', { type: 'seo', id: data.key, label: data.key }]))

/** Image slots a section's content replaces; cleared once that section is saved. */
const REPLACED_SLOTS: Partial<Record<SectionContentKey, string>> = { 'home:devices': 'hardware.' }

/** Saves one section's content from /admin/pages; `content: null` goes back to the defaults. */
export const saveSectionContentFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('pages')])
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
      const saved = await write(
        'admin.section_content_reset',
        () => deleteSectionContent(page, sectionKey, REPLACED_SLOTS[data.key]),
        [context.admin, 'page.reset', { type: 'page', id: data.key, label: data.key }],
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

    const saved = await write(
      'admin.section_content_saved',
      () => saveSectionContent(page, sectionKey, content, context.admin.email, REPLACED_SLOTS[data.key]),
      [context.admin, 'page.update', { type: 'page', id: data.key, label: data.key }],
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

export const getFooterSettingsFn = createServerFn({ method: 'GET' })
  .middleware([requirePermission('footer')])
  .handler(async () => {
    try {
      const rows = await listSectionContent()
      const row = rows.find((r) => r.page === 'global' && r.sectionKey === 'footer')
      const footer = (row?.content as FooterSettings | undefined) ?? (FOOTER_CONFIG as FooterSettings)
      return { ok: true as const, footer }
    } catch (error) {
      logger.error('admin.footer_load_failed', errorFields(error))
      return { ok: true as const, footer: FOOTER_CONFIG as FooterSettings }
    }
  })

export const saveFooterSettingsFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('footer')])
  .validator((data: unknown) => FooterSettingsSchema.parse(data))
  .handler(async ({ data, context }): Promise<Saved> => {
    return write(
      'admin.footer_saved',
      () => saveSectionContent('global', 'footer', data as unknown as Json, context.admin.email),
      [context.admin, 'footer.update', { type: 'footer' }],
    )
  })

export const resetFooterSettingsFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('footer')])
  .handler(async ({ context }): Promise<Saved> => {
    return write('admin.footer_reset', () => deleteSectionContent('global', 'footer'), [context.admin, 'footer.reset', { type: 'footer' }])
  })

export const savePageVisibilityFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('pages')])
  .validator((data: unknown) => PageVisibilitySchema.parse(data))
  .handler(async ({ data, context }): Promise<Saved> => {
    return write(
      'admin.page_visibility_saved',
      () => saveSectionContent('global', 'page_visibility', data as unknown as Json, context.admin.email),
      [context.admin, 'page.update', { type: 'page', label: 'Ẩn/hiện các trang' }],
    )
  })

export const togglePageVisibilityFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('pages')])
  .validator((data: unknown) => z.object({ pageKey: z.string().min(1), visible: z.boolean() }).parse(data))
  .handler(async ({ data, context }): Promise<Saved> => {
    return write('admin.page_visibility_toggled', async () => {
      const rows = await listSectionContent()
      const row = rows.find((r) => r.page === 'global' && r.sectionKey === 'page_visibility')
      const current = (row?.content as Record<string, boolean> | undefined) ?? {}
      const updated = { ...current, [data.pageKey]: data.visible }
      await saveSectionContent('global', 'page_visibility', updated as unknown as Json, context.admin.email)
    }, [context.admin, 'page.update', { type: 'page', id: data.pageKey, label: `${data.visible ? 'Hiện' : 'Ẩn'} trang ${data.pageKey}` }])
  })
