/**
 * Shrinks an image in the browser before it is uploaded to the library:
 * longest side at most MAX_EDGE, re-encoded as WebP (JPEG where the browser
 * can't write WebP, PNG when it has transparency). The server only stores
 * files (Workers can't run image libraries), so this is where images get
 * web-sized. Small, already-compressed files pass through untouched.
 */

export const MAX_EDGE = 2000
/** Aim for this after compression; the server's hard limit is MAX_IMAGE_BYTES. */
export const TARGET_BYTES = 500 * 1024
/** Files this small in a web format are uploaded as they are. */
const KEEP_BELOW_BYTES = 300 * 1024
const WEB_TYPES = ['image/webp', 'image/avif', 'image/jpeg']
// Each step is tried until the file is under TARGET_BYTES.
const STEPS = [
  { edge: MAX_EDGE, quality: 0.82 },
  { edge: MAX_EDGE, quality: 0.7 },
  { edge: 1600, quality: 0.7 },
  { edge: 1280, quality: 0.65 },
]

export interface PreparedImage {
  file: File
  before: number
  after: number
  /** False when the original was kept. */
  changed: boolean
}

/** Width and height scaled down so the longest side is at most `maxEdge`. */
export function fitWithin(width: number, height: number, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

const EXT: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' }

/** "menu board.PNG" + image/webp → "menu board.webp". */
export function renameFor(name: string, type: string) {
  const base = name.replace(/\.[^.]+$/, '') || 'image'
  return `${base}.${EXT[type] ?? 'img'}`
}

function hasTransparency(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, w: number, h: number) {
  const data = ctx.getImageData(0, 0, w, h).data
  for (let i = 3; i < data.length; i += 4) if ((data[i] ?? 255) < 255) return true
  return false
}

function makeCanvas(w: number, h: number) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

async function encode(canvas: OffscreenCanvas | HTMLCanvasElement, type: string, quality: number) {
  if ('convertToBlob' in canvas) return canvas.convertToBlob({ type, quality })
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
}

async function render(bitmap: ImageBitmap, edge: number, quality: number, transparent: boolean) {
  const size = fitWithin(bitmap.width, bitmap.height, edge)
  const canvas = makeCanvas(size.width, size.height)
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null
  if (!ctx) return null
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, size.width, size.height)
  const webp = await encode(canvas, 'image/webp', quality)
  // Browsers that can't write WebP (Safari) return a PNG instead of failing.
  if (webp?.type === 'image/webp') return webp
  if (transparent) return encode(canvas, 'image/png', 1)
  return encode(canvas, 'image/jpeg', quality)
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  const keep: PreparedImage = { file, before: file.size, after: file.size, changed: false }
  let bitmap: ImageBitmap
  try {
    // Applies the photo's EXIF rotation, so phone pictures are not sideways.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    // Not decodable here (e.g. a broken file): the server checks it and explains.
    return keep
  }

  try {
    const fits = Math.max(bitmap.width, bitmap.height) <= MAX_EDGE
    if (fits && file.size <= KEEP_BELOW_BYTES && WEB_TYPES.includes(file.type)) return keep

    // Only formats that can hold transparency need the (full-size) pixel check.
    let transparent = false
    if (file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/gif') {
      const probe = makeCanvas(bitmap.width, bitmap.height)
      const ctx = probe.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0)
        transparent = hasTransparency(ctx, bitmap.width, bitmap.height)
      }
    }

    let best: Blob | null = null
    for (const step of STEPS) {
      const blob = await render(bitmap, step.edge, step.quality, transparent)
      if (blob && (!best || blob.size < best.size)) best = blob
      if (best && best.size <= TARGET_BYTES) break
    }
    // Keep the original when re-encoding did not help and no resize was needed.
    if (!best || (fits && best.size >= file.size && WEB_TYPES.includes(file.type))) return keep

    const out = new File([best], renameFor(file.name, best.type), { type: best.type, lastModified: file.lastModified })
    return { file: out, before: file.size, after: out.size, changed: true }
  } finally {
    bitmap.close()
  }
}
