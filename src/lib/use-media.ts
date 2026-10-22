import { STOCK_SCREEN_IMAGES } from '~/data/compatible-devices'
import { MEDIA_SLOTS } from '~/data/media-slots'
import { useSiteConfig } from '~/lib/use-site-config'

export interface ResolvedImage {
  src: string
  alt: string
  width: number
  height: number
}

/** The uploaded image for a slot, else its default; null when neither exists. */
export function useMedia(key: string): ResolvedImage | null {
  const { media } = useSiteConfig()
  const override = media[key]
  if (override) return { src: override.url, alt: override.alt, width: override.width, height: override.height }
  return MEDIA_SLOTS.find((s) => s.key === key)?.fallback ?? null
}

/**
 * Resized URL through Cloudflare Image Transformations when the zone has them
 * enabled (VITE_PUBLIC_IMAGE_TRANSFORMS=true); otherwise the original file.
 */
export function imageUrl(src: string, width: number) {
  if (import.meta.env.VITE_PUBLIC_IMAGE_TRANSFORMS !== 'true') return src
  return `/cdn-cgi/image/width=${width},quality=80,format=auto/${src.replace(/^\//, '')}`
}

/** Screen photos for the 3D walls, with uploads applied, padded to `count` tiles. */
export function useScreenWall(count = 12): { src: string; alt: string }[] {
  const { media } = useSiteConfig()
  const photos = STOCK_SCREEN_IMAGES.map((img, i) => {
    const o = media[`screens.${i + 1}`]
    return o ? { src: o.url, alt: o.alt } : img
  })
  return Array.from({ length: count }, (_, i) => photos[i % photos.length]).filter(
    (p): p is { src: string; alt: string } => Boolean(p),
  )
}
