import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, MEDIA_SLOT_KEYS } from '~/data/media-slots'
import { adminMiddleware } from '~/server/functions/admin-middleware'
import { errorFields, logger } from '~/server/logger'
import { readImageSize } from '~/server/media/image-size'
import { deleteMediaSlot, getMediaSlot, listMediaSlots, updateMediaAlt, upsertMediaSlot } from '~/server/media/repository'
import { getStorage } from '~/server/media/storage'
import { invalidateSiteConfig } from '~/server/site/config'

const slotKey = z.enum(MEDIA_SLOT_KEYS as [string, ...string[]])
const altText = z.string().trim().min(3, 'Describe the image in a few words').max(200)

const EXTENSIONS: Record<string, string> = {
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

type Result = { ok: true } | { ok: false; error: string }

export const listMediaFn = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () => {
    try {
      return { ok: true as const, slots: await listMediaSlots() }
    } catch (error) {
      logger.error('admin.media_list_failed', errorFields(error))
      return { ok: false as const, slots: [] }
    }
  })

export const uploadMediaFn = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error('Expected form data')
    const file = data.get('file')
    if (!(file instanceof File)) throw new Error('Choose an image file')
    return { key: slotKey.parse(data.get('key')), alt: altText.parse(data.get('alt')), file }
  })
  .handler(async ({ data, context }): Promise<Result> => {
    if (data.file.size > MAX_IMAGE_BYTES) {
      return { ok: false, error: `The file is ${(data.file.size / 1024 / 1024).toFixed(1)} MB. Keep images under 1.5 MB.` }
    }
    const bytes = new Uint8Array(await data.file.arrayBuffer())
    // Trust the file's own header, not its name or the browser's MIME type.
    const size = readImageSize(bytes)
    if (!size || !ALLOWED_IMAGE_TYPES.some((t) => t === size.type)) {
      return { ok: false, error: 'Use a WebP, AVIF, JPEG or PNG image.' }
    }
    if (size.width < 200 || size.height < 200 || size.width > 6000 || size.height > 6000) {
      return { ok: false, error: `The image is ${size.width} × ${size.height}. Use something between 200 and 6000 pixels per side.` }
    }

    try {
      const storage = getStorage()
      const previous = await getMediaSlot(data.key)
      const storageKey = `media/${data.key.replace(/\./g, '/')}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${EXTENSIONS[size.type]}`
      const { url } = await storage.put(storageKey, bytes, size.type)
      await upsertMediaSlot({
        key: data.key,
        url,
        storageKey,
        alt: data.alt,
        width: size.width,
        height: size.height,
        updatedBy: context.admin.email,
      })
      // Remove the replaced file only after the new one is live.
      if (previous) await storage.remove(previous.storageKey).catch(() => undefined)
      invalidateSiteConfig()
      logger.info('admin.media_uploaded', { slot: data.key, bytes: bytes.length })
      return { ok: true }
    } catch (error) {
      logger.error('admin.media_upload_failed', errorFields(error))
      return { ok: false, error: 'Upload failed. Check the R2 settings and the server logs.' }
    }
  })

export const updateMediaAltFn = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator((data: unknown) => z.object({ key: slotKey, alt: altText }).parse(data))
  .handler(async ({ data, context }): Promise<Result> => {
    const row = await updateMediaAlt(data.key, data.alt, context.admin.email)
    if (!row) return { ok: false, error: 'Upload an image for this slot first.' }
    invalidateSiteConfig()
    return { ok: true }
  })

/** Goes back to the slot's default image. */
export const resetMediaFn = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator((data: unknown) => z.object({ key: slotKey }).parse(data))
  .handler(async ({ data }): Promise<Result> => {
    try {
      const row = await deleteMediaSlot(data.key)
      if (row) await getStorage().remove(row.storageKey).catch(() => undefined)
      invalidateSiteConfig()
      return { ok: true }
    } catch (error) {
      logger.error('admin.media_reset_failed', errorFields(error))
      return { ok: false, error: 'Reset failed. Try again.' }
    }
  })
