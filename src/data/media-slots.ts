import { STOCK_SCREEN_IMAGES, VIEWIX_HARDWARE } from '~/data/compatible-devices'
import { USE_CASES } from '~/content/useCases'

/**
 * Named image slots an admin can replace in /admin/media. Each slot keeps its
 * place in the layout; only the file and alt text change. `fallback` is what
 * shows until an image is uploaded (null = the section's own placeholder).
 */
export interface MediaSlot {
  key: string
  group: 'Viewix hardware' | 'Use case covers' | 'Screen photos'
  label: string
  /** Shown to the editor, e.g. "Transparent WebP, about 800 × 800". */
  guidance: string
  fallback: { src: string; alt: string; width: number; height: number } | null
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const MEDIA_SLOTS: MediaSlot[] = [
  ...VIEWIX_HARDWARE.map((line) => ({
    key: `hardware.${slugify(line.name)}`,
    group: 'Viewix hardware' as const,
    label: line.name,
    guidance: 'Product photo on a transparent or plain background, WebP or PNG, about 800 × 800.',
    fallback: line.image ? { src: line.image, alt: line.name, width: 800, height: 800 } : null,
  })),
  ...USE_CASES.map((uc) => ({
    key: `use-case.${uc.slug}.cover`,
    group: 'Use case covers' as const,
    label: uc.title,
    guidance: 'Real deployment photo, 16:9, WebP, 1600 × 900 or larger.',
    fallback: { ...uc.cover, width: 960, height: 540 },
  })),
  ...STOCK_SCREEN_IMAGES.map((img, i) => ({
    key: `screens.${i + 1}`,
    group: 'Screen photos' as const,
    label: img.alt,
    guidance: 'Screens in a real place, 16:9, WebP, 1600 × 900. Avoid third-party logos.',
    fallback: { ...img, width: 960, height: 540 },
  })),
]

export const MEDIA_SLOT_KEYS = MEDIA_SLOTS.map((s) => s.key)

export function hardwareSlotKey(name: string) {
  return `hardware.${slugify(name)}`
}

export const ALLOWED_IMAGE_TYPES = ['image/webp', 'image/avif', 'image/jpeg', 'image/png'] as const
export const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024
