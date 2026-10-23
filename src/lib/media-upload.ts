import type { MediaUploadResult } from '~/routes/api/admin/media-upload'

/** Frame size of a video, read by the browser since it can decode the file. Null when it can't play it. */
export function readVideoSize(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    const done = (size: { width: number; height: number } | null) => {
      URL.revokeObjectURL(url)
      resolve(size)
    }
    video.onloadedmetadata = () => done(video.videoWidth > 0 ? { width: video.videoWidth, height: video.videoHeight } : null)
    video.onerror = () => done(null)
    video.src = url
  })
}

/** One XMLHttpRequest, rather than fetch, for upload progress. Resolves with the status and body. */
function send(
  method: 'POST' | 'PUT',
  url: string,
  body: FormData | File,
  headers: Record<string, string>,
  onProgress: (share: number) => void,
): Promise<{ status: number; text: string } | null> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open(method, url)
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total)
    }
    xhr.onload = () => resolve({ status: xhr.status, text: xhr.responseText })
    xhr.onerror = () => resolve(null)
    xhr.send(body)
  })
}

/** Sends a form to /api/admin/media-upload. */
export async function sendMediaUpload(body: FormData, onProgress: (share: number) => void = () => {}): Promise<MediaUploadResult> {
  const res = await send('POST', '/api/admin/media-upload', body, {}, onProgress)
  if (!res) return { ok: false, error: 'Upload failed. Check your connection.' }
  try {
    return JSON.parse(res.text) as MediaUploadResult
  } catch {
    return { ok: false, error: 'Upload failed. Try again.' }
  }
}

const form = (fields: Record<string, string | File>) => {
  const body = new FormData()
  for (const [k, v] of Object.entries(fields)) body.set(k, v)
  return body
}

/**
 * Adds a video to the library. With R2 the file goes straight from the browser
 * to the bucket on a signed URL, then the server checks it; without R2 (local
 * development) it goes through the server.
 */
export async function uploadLibraryVideo(
  file: File,
  size: { width: number; height: number },
  onProgress: (share: number) => void,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const meta = { width: String(size.width), height: String(size.height) }
  const start = await sendMediaUpload(
    form({ kind: 'video-start', fileName: file.name, contentType: file.type, bytes: String(file.size), ...meta }),
  )
  if (!start.ok) return start
  if (start.kind !== 'video-start') return { ok: false, error: 'Upload failed. Try again.' }

  if (start.mode === 'server') {
    const res = await sendMediaUpload(form({ kind: 'video', file, ...meta }), onProgress)
    return res.ok ? { ok: true } : res
  }

  const put = await send('PUT', start.uploadUrl, file, { 'Content-Type': file.type, 'Cache-Control': start.cacheControl }, onProgress)
  if (!put || put.status >= 300) {
    // Status 0 is what a missing CORS rule on the bucket looks like from the browser.
    return {
      ok: false,
      error: put?.status
        ? `Storage refused ${file.name} (HTTP ${put.status}). Try again.`
        : `${file.name} could not reach storage. Check your connection, and that the R2 bucket allows uploads from this site (CORS).`,
    }
  }
  const finish = await sendMediaUpload(form({ kind: 'video-finish', key: start.key, fileName: file.name, ...meta }))
  return finish.ok ? { ok: true } : finish
}
