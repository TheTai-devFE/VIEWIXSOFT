import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { ALLOWED_VIDEO_TYPES, altFromFileName, MAX_VIDEO_BYTES } from '~/data/media-slots'
import { MAX_CAPTIONS_BYTES } from '~/lib/section-content'
import type { CaptionsFile } from '~/lib/section-content'
import { can, UPLOAD_PERMISSIONS } from '~/lib/permissions'
import { getAdminSession } from '~/server/auth'
import { logActivity } from '~/server/activity/repository'
import { errorFields, logger } from '~/server/logger'
import { insertMediaAsset } from '~/server/media/repository'
import { getStorage, UPLOAD_CACHE_CONTROL } from '~/server/media/storage'
import { cleanFileName, isWebVtt, sniffVideoType } from '~/server/media/video-file'

/*
 * Large admin uploads: videos for the library in /admin/media, and captions
 * for a video placed in /admin/pages. A plain route rather than a server
 * function so the browser can report upload progress. Images keep using
 * `uploadMediaAssetFn`, since they are small after compression.
 *
 * Videos are too big to pass through a Worker, so with R2 they go in three
 * steps: `video-start` hands out a signed URL, the browser PUTs the file
 * straight to the bucket, and `video-finish` checks the stored file before it
 * joins the library. Without R2 (local development) `video` sends the file
 * through this route instead.
 */

export type MediaUploadResult =
  | { ok: true; kind: 'video' }
  | { ok: true; kind: 'video-start'; mode: 'direct'; key: string; uploadUrl: string; cacheControl: string }
  | { ok: true; kind: 'video-start'; mode: 'server' }
  | { ok: true; kind: 'captions'; file: CaptionsFile }
  | { ok: false; error: string }

// Measured in the browser, which can decode the file; the server only sniffs the header.
const VideoMetaSchema = z.object({
  width: z.coerce.number().int().positive().max(8000),
  height: z.coerce.number().int().positive().max(8000),
})

const StartSchema = VideoMetaSchema.extend({
  contentType: z.enum(ALLOWED_VIDEO_TYPES),
  bytes: z.coerce.number().int().positive(),
  fileName: z.string().min(1).max(500),
})

// Only keys this route hands out, so `video-finish` can't adopt any other file in the bucket.
const LIBRARY_VIDEO_KEY = /^media\/library\/\d+-[a-f0-9]{8}\.(mp4|webm)$/

const FinishSchema = VideoMetaSchema.extend({
  key: z.string().regex(LIBRARY_VIDEO_KEY),
  fileName: z.string().min(1).max(500),
})

const mb = (n: number) => `${Math.round(n / 1024 / 1024)} MB`
const fail = (error: string, status = 400) => Response.json({ ok: false, error } satisfies MediaUploadResult, { status })
const ok = (result: MediaUploadResult) => Response.json(result)
const uniqueName = () => `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
const tooBig = (name: string, bytes: number) => `${name} is ${mb(bytes)}. Keep videos under ${mb(MAX_VIDEO_BYTES)}.`

export async function handleMediaUpload(request: Request) {
  // Cookies are SameSite, but a cross-site form post is refused outright too.
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) return fail('Forbidden', 403)
  const admin = await getAdminSession()
  if (!admin) return fail('Sign in again to upload.', 401)
  if (!can(admin, ...UPLOAD_PERMISSIONS)) return fail('Your account cannot upload files.', 403)

  // Refuse oversized bodies before reading them into memory.
  const length = Number(request.headers.get('content-length') ?? 0)
  if (length > MAX_VIDEO_BYTES + 64 * 1024) return fail(`Keep videos under ${mb(MAX_VIDEO_BYTES)}.`, 413)

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return fail('The upload could not be read. Try again.')
  }
  const fields = Object.fromEntries(form)

  try {
    const storage = getStorage()
    const kind = form.get('kind')

    if (kind === 'video-start') {
      const input = StartSchema.safeParse(fields)
      if (!input.success) return fail('Use an MP4 (H.264) or WebM video the browser can play.')
      const name = cleanFileName(input.data.fileName)
      if (input.data.bytes > MAX_VIDEO_BYTES) return fail(tooBig(name, input.data.bytes))
      if (!storage.direct) return ok({ ok: true, kind: 'video-start', mode: 'server' })
      const key = `media/library/${uniqueName()}.${input.data.contentType === 'video/mp4' ? 'mp4' : 'webm'}`
      const uploadUrl = await storage.direct.presignPut(key, input.data.contentType)
      return ok({ ok: true, kind: 'video-start', mode: 'direct', key, uploadUrl, cacheControl: UPLOAD_CACHE_CONTROL })
    }

    if (kind === 'video-finish') {
      const input = FinishSchema.safeParse(fields)
      if (!input.success || !storage.direct) return fail('The upload could not be finished. Try again.')
      const { key, width, height } = input.data
      const name = cleanFileName(input.data.fileName)
      const bytes = await storage.direct.size(key)
      if (bytes === null) return fail(`${name} did not reach storage. Try again.`)
      const head = await storage.direct.readStart(key, 16)
      const contentType = head ? sniffVideoType(head) : null
      // Whatever arrived is checked like a server upload; a bad file is removed again.
      const problem = bytes > MAX_VIDEO_BYTES ? tooBig(name, bytes) : contentType ? null : `${name}: use an MP4 or WebM video.`
      if (problem || !contentType) {
        await storage.remove(key).catch(() => undefined)
        return fail(problem ?? `${name}: use an MP4 or WebM video.`)
      }
      await insertMediaAsset({
        url: storage.urlFor(key),
        storageKey: key,
        fileName: name,
        contentType,
        bytes,
        width,
        height,
        alt: altFromFileName(name),
        uploadedBy: admin.email,
      })
      logger.info('admin.media_uploaded', { bytes, contentType, direct: true })
      await logActivity(admin, 'media.upload', { type: 'media', label: name })
      return ok({ ok: true, kind: 'video' })
    }

    const file = form.get('file')
    if (!(file instanceof File)) return fail('Choose a file.')
    const fileName = cleanFileName(file.name)

    if (kind === 'captions') {
      if (file.size > MAX_CAPTIONS_BYTES) return fail(`Keep the captions file under ${MAX_CAPTIONS_BYTES / 1024} KB.`)
      const bytes = new Uint8Array(await file.arrayBuffer())
      if (!isWebVtt(bytes)) return fail(`${fileName}: use a WebVTT (.vtt) captions file.`)
      const storageKey = `media/captions/${uniqueName()}.vtt`
      const { url } = await storage.put(storageKey, bytes, 'text/vtt')
      logger.info('admin.captions_uploaded', { bytes: bytes.length })
      return ok({ ok: true, kind: 'captions', file: { storageKey, url, fileName, bytes: bytes.length } })
    }

    // Through this route only without R2; a Worker can't hold a large video in memory.
    if (storage.direct) return fail('Videos upload straight to storage. Reload the page and try again.')
    if (file.size > MAX_VIDEO_BYTES) return fail(tooBig(fileName, file.size))
    const meta = VideoMetaSchema.safeParse(fields)
    if (!meta.success) return fail(`${fileName}: the browser could not read this video. Use an MP4 (H.264) or WebM file.`)
    const bytes = new Uint8Array(await file.arrayBuffer())
    const contentType = sniffVideoType(bytes)
    if (!contentType) return fail(`${fileName}: use an MP4 or WebM video.`)

    const storageKey = `media/library/${uniqueName()}.${contentType === 'video/mp4' ? 'mp4' : 'webm'}`
    const { url } = await storage.put(storageKey, bytes, contentType)
    await insertMediaAsset({
      url,
      storageKey,
      fileName,
      contentType,
      bytes: bytes.length,
      ...meta.data,
      alt: altFromFileName(fileName),
      uploadedBy: admin.email,
    })
    logger.info('admin.media_uploaded', { bytes: bytes.length, contentType })
    await logActivity(admin, 'media.upload', { type: 'media', label: fileName })
    return ok({ ok: true, kind: 'video' })
  } catch (error) {
    logger.error('admin.media_upload_failed', errorFields(error))
    return fail('Upload failed. Check the R2 settings and the server logs.', 500)
  }
}

export const Route = createFileRoute('/api/admin/media-upload')({
  server: { handlers: { POST: ({ request }) => handleMediaUpload(request) } },
})
