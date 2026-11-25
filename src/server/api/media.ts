import '@tanstack/react-start/server-only'
import { z } from 'zod'
import { MAX_IMAGE_BYTES } from '~/data/media-slots'
import { readImageSize } from '~/server/media/image-size'
import { insertMediaAsset } from '~/server/media/repository'
import { getStorage } from '~/server/media/storage'
import { apiError, apiOk, authorize, guarded, validationError } from './v1'

// Alt text describes the picture for screen readers and search. A file name is not a description.
const FILE_NAME_ALT = /\.(jpe?g|png|webp|avif|gif|svg)$|_/i

const fields = z.object({
  alt: z
    .string()
    .trim()
    .min(10, 'Alt text needs at least 10 characters.')
    .max(125, 'Alt text is at most 125 characters.')
    .refine((alt) => !FILE_NAME_ALT.test(alt), 'Describe the picture in words; a file name is not alt text.'),
  title: z.string().trim().min(1).max(200),
  caption: z.string().trim().min(1).max(1000),
  description: z.string().trim().min(1).max(2000),
})

// Bound the entire multipart envelope, including requests without Content-Length.
async function readForm(request: Request) {
  const limit = MAX_IMAGE_BYTES + 32 * 1024
  const tooLarge = () => apiError(413, 'too_large', 'Use an image under 1 MiB.')
  if (Number(request.headers.get('content-length')) > limit) return tooLarge()
  const type = request.headers.get('content-type') || ''
  if (!request.body || !type.toLowerCase().startsWith('multipart/form-data;')) {
    return apiError(422, 'validation_failed', 'Send multipart/form-data with a file field.')
  }
  const reader = request.body.getReader()
  const chunks: ArrayBuffer[] = []
  let length = 0
  try {
    while (true) {
      const part = await reader.read()
      if (part.done) break
      length += part.value.byteLength
      if (length > limit) {
        await reader.cancel()
        return tooLarge()
      }
      chunks.push(part.value.slice().buffer)
    }
    return await new Response(new Blob(chunks), { headers: { 'Content-Type': type } }).formData()
  } catch {
    return apiError(422, 'validation_failed', 'Invalid multipart upload.')
  } finally {
    reader.releaseLock()
  }
}

export function handleUploadImage(request: Request) {
  return guarded('api.media_upload_failed', async () => {
    const key = await authorize(request, 'media:write')
    if (key instanceof Response) return key
    const form = await readForm(request)
    if (form instanceof Response) return form
    const parsed = fields.safeParse(Object.fromEntries(form))
    if (!parsed.success) return validationError(parsed.error)
    const file = form.get('file')
    if (!(file instanceof File)) return apiError(422, 'validation_failed', 'Choose an image file.')
    if (file.size > MAX_IMAGE_BYTES) return apiError(413, 'too_large', 'Use an image under 1 MiB.')
    const bytes = new Uint8Array(await file.arrayBuffer())
    const size = readImageSize(bytes)
    if (!size || Math.max(size.width, size.height) > 6000 || Math.max(size.width, size.height) < 200 || Math.min(size.width, size.height) < 40) {
      return apiError(422, 'validation_failed', 'Use PNG, JPEG, WebP or AVIF, 200–6000 px on the long side and at least 40 px on the short side.')
    }
    const storage = getStorage()
    const extension = size.type === 'image/jpeg' ? 'jpg' : size.type.slice('image/'.length)
    const storageKey = `media/library/${crypto.randomUUID()}.${extension}`
    const { url } = await storage.put(storageKey, bytes, size.type)
    const { alt, title, caption, description } = parsed.data
    try {
      const asset = await insertMediaAsset({
        url, storageKey, fileName: file.name.slice(0, 200), contentType: size.type,
        bytes: bytes.length, width: size.width, height: size.height, uploadedBy: key.createdBy,
        alt, imageTitle: title, caption, description,
      })
      return apiOk({ id: asset.id, url, alt, title, caption, description, width: size.width, height: size.height }, 201)
    } catch (error) {
      await storage.remove(storageKey)
      throw error
    }
  })
}
