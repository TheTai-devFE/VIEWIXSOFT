import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { findAdminPage } from '~/data/admin-pages'
import { ALLOWED_IMAGE_TYPES, altFromFileName, isVideoAsset, MAX_IMAGE_BYTES, MEDIA_SLOTS, slotPages } from '~/data/media-slots'
import { SECTION_PAGES } from '~/data/site-sections'
import type { SectionPage } from '~/data/site-sections'
import { SaveMediaSlotsSchema } from '~/lib/admin-schemas'
import { assetIdsIn } from '~/lib/section-content'
import { requirePermission } from '~/server/functions/admin-middleware'
import { logActivity } from '~/server/activity/repository'
import { UPLOAD_PERMISSIONS } from '~/lib/permissions'
import { errorFields, logger } from '~/server/logger'
import { readImageSize } from '~/server/media/image-size'
import {
  deleteMediaAsset,
  getAssetsByIds,
  getMediaAsset,
  insertMediaAsset,
  listMediaAssets,
  listMediaSlots,
  saveMediaSlots,
  slotsUsingAsset,
} from '~/server/media/repository'
import { getStorage } from '~/server/media/storage'
import { listSectionContent, sectionsUsingAsset } from '~/server/site/repository'
import { invalidateSiteConfig } from '~/server/site/config'

const EXTENSIONS: Record<string, string> = {
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

type Result =
  | {
      ok: true
      asset?: {
        id: string
        url: string
        fileName: string
        contentType: string
        width: number
        height: number
        alt: string
        createdAt: Date
      }
    }
  | { ok: false; error: string }

/** The library plus which slot shows which image, for /admin/media and the page editors. */
export const listMediaLibraryFn = createServerFn({ method: 'GET' })
  .middleware([requirePermission(...UPLOAD_PERMISSIONS)])
  .handler(async () => {
    try {
      const [assets, slots, content] = await Promise.all([listMediaAssets(), listMediaSlots(), listSectionContent()])
      // Images picked inside edited section content, e.g. the device photos.
      const sectionUses = content.flatMap((c) =>
        assetIdsIn(c.content).map((assetId) => ({ assetId, label: describeSection(c.page, c.sectionKey) })),
      )
      return { ok: true as const, assets, slots, sectionUses }
    } catch (error) {
      logger.error('admin.media_list_failed', errorFields(error))
      return { ok: false as const, assets: [], slots: [], sectionUses: [] }
    }
  })

/** Adds one image to the library. It shows nowhere until a page picks it. Videos go through /api/admin/media-upload. */
export const uploadMediaAssetFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission(...UPLOAD_PERMISSIONS)])
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error('Expected form data')
    const file = data.get('file')
    if (!(file instanceof File)) throw new Error('Choose an image file')
    return { file }
  })
  .handler(async ({ data, context }): Promise<Result> => {
    const name = data.file.name.slice(0, 200)
    if (data.file.size > MAX_IMAGE_BYTES) {
      const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`
      return {
        ok: false,
        error: `${name} is still ${mb(data.file.size)} after compression. Keep it under ${mb(MAX_IMAGE_BYTES)}, e.g. export it smaller or as WebP.`,
      }
    }
    const bytes = new Uint8Array(await data.file.arrayBuffer())
    // Trust the file's own header, not its name or the browser's MIME type.
    const size = readImageSize(bytes)
    if (!size || !ALLOWED_IMAGE_TYPES.some((t) => t === size.type)) {
      return { ok: false, error: `${name}: use a WebP, AVIF, JPEG or PNG image.` }
    }
    // Wide logos are short, so only the longer side needs 200 px.
    const long = Math.max(size.width, size.height)
    const short = Math.min(size.width, size.height)
    if (long < 200 || short < 40 || long > 6000) {
      return {
        ok: false,
        error: `${name} is ${size.width} × ${size.height}. Use at least 200 px on the long side and 40 px on the short side, up to 6000 px.`,
      }
    }

    try {
      const storageKey = `media/library/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${EXTENSIONS[size.type]}`
      const { url } = await getStorage().put(storageKey, bytes, size.type)
      const asset = await insertMediaAsset({
        url,
        storageKey,
        fileName: name,
        contentType: size.type,
        bytes: bytes.length,
        width: size.width,
        height: size.height,
        alt: altFromFileName(name),
        uploadedBy: context.admin.email,
      })
      logger.info('admin.media_uploaded', { bytes: bytes.length })
      await logActivity(context.admin, 'media.upload', { type: 'media', id: asset.id, label: asset.fileName })
      return { ok: true, asset }
    } catch (error) {
      logger.error('admin.media_upload_failed', errorFields(error))
      return { ok: false, error: 'Upload failed. Check the R2 settings and the server logs.' }
    }
  })

/** "Home (Compatible devices)" for a SECTION_PAGES page and section key. */
function describeSection(page: string, sectionKey: string) {
  const def = SECTION_PAGES[page as SectionPage] as (typeof SECTION_PAGES)[SectionPage] | undefined
  const label = def?.sections.find((s) => s.key === sectionKey)?.label ?? sectionKey
  return `${def?.label ?? page} (${label})`
}

/** Where a slot shows, for messages: "Home (Floor-standing advertising display)". */
function describeSlot(key: string) {
  const slot = MEDIA_SLOTS.find((s) => s.key === key)
  if (!slot) return key
  const pages = slotPages(slot).map((p) => findAdminPage(p)?.page.label ?? p).join(', ')
  return `${pages} (${slot.label})`
}

/** Deletes a library image or video. Refused while a page still shows it. */
export const deleteMediaAssetFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('media')])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<Result> => {
    try {
      const [slots, sections] = await Promise.all([slotsUsingAsset(data.id), sectionsUsingAsset(data.id)])
      const used = [...slots.map(describeSlot), ...sections.map((s) => describeSection(s.page, s.sectionKey))]
      if (used.length) {
        return { ok: false, error: `This file is used on ${used.join('; ')}. Pick another one there first.` }
      }
      const asset = await getMediaAsset(data.id)
      if (!asset) return { ok: true }
      await deleteMediaAsset(data.id)
      // Remove the file only after the row is gone, so the site never points at a missing file.
      await getStorage()
        .remove(asset.storageKey)
        .catch(() => undefined)
      logger.info('admin.media_deleted')
      await logActivity(context.admin, 'media.delete', { type: 'media', id: asset.id, label: asset.fileName })
      return { ok: true }
    } catch (error) {
      logger.error('admin.media_delete_failed', errorFields(error))
      return { ok: false, error: 'The file could not be deleted. Try again.' }
    }
  })

/** Saves a page's image picks from /admin/pages. */
export const saveMediaSlotsFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('media', 'pages')])
  .validator((data: unknown) => SaveMediaSlotsSchema.parse(data))
  .handler(async ({ data, context }): Promise<Result> => {
    try {
      const ids = data.changes.flatMap((c) => (c.assetId ? [c.assetId] : []))
      const picked = await getAssetsByIds([...new Set(ids)])
      if (picked.length !== new Set(ids).size) return { ok: false, error: 'An image was deleted from the library. Pick it again.' }
      // Image places only; videos are placed through section content.
      if (picked.some(isVideoAsset)) return { ok: false, error: 'Pick an image here, not a video.' }
      await saveMediaSlots(data.changes, context.admin.email)
      invalidateSiteConfig()
      logger.info('admin.media_slots_saved', { count: data.changes.length })
      await logActivity(context.admin, 'page.update', { type: 'page', label: `Ảnh trên trang (${data.changes.length} vị trí)` })
      return { ok: true }
    } catch (error) {
      logger.error('admin.media_slots_save_failed', errorFields(error))
      return { ok: false, error: 'Images could not be saved. Try again.' }
    }
  })
