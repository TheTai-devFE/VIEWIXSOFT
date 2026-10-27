import { STOCK_SCREEN_IMAGES } from '~/data/compatible-devices'
import { USE_CASES } from '~/content/useCases'

/**
 * Named image places on the site. Images are uploaded to the library in
 * /admin/media; each page's editor in /admin/pages picks a library image for
 * the slots it shows. A slot keeps its place in the layout; only the file and
 * alt text change. `fallback` is what shows until an image is picked (null =
 * the section's own placeholder).
 */
export interface MediaSlot {
  key: string
  group: 'Use case covers' | 'Screen photos' | 'About photos' | 'Link preview'
  label: string
  /** Shown to the editor, e.g. "Transparent WebP, about 800 × 800". */
  guidance: string
  fallback: { src: string; alt: string; width: number; height: number } | null
  /**
   * Where the slot shows: an /admin/pages page key and, on pages with
   * sections, the section holding it. Picking an image in one place changes it in all.
   * Empty for the site-wide link preview image, which is picked in /admin/seo.
   */
  places: { page: string; section?: string }[]
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const stockPhoto = (file: string) => STOCK_SCREEN_IMAGES.find((img) => img.src.endsWith(file)) ?? null

/** The image chat apps and social networks show for a shared link, on every page without its own. */
export const SHARE_IMAGE_SLOT = 'site.share-image'

export const MEDIA_SLOTS: MediaSlot[] = [
  {
    key: SHARE_IMAGE_SLOT,
    group: 'Link preview',
    label: 'Link preview image',
    // Uploads under 300 KB keep their format (src/lib/image-prepare.ts); some chat apps skip WebP previews.
    guidance: 'JPG, exactly 1200 × 630, under 300 KB so it stays a JPG. Keep text away from the edges.',
    fallback: { src: '/og-image.jpg', alt: 'Viewixsoft: run every advertising screen from one cloud platform', width: 1200, height: 630 },
    places: [],
  },
  {
    key: 'about.hero',
    group: 'About photos',
    label: 'Hero photo',
    guidance: 'Wide photo of screens in a real place, 16:9, WebP, 2400 × 1350.',
    fallback: (() => {
      const photo = stockPhoto('digital-menu-boards.webp')
      return photo ? { ...photo, width: 960, height: 540 } : null
    })(),
    places: [{ page: 'about', section: 'hero' }],
  },
  // The two photos beside the About page story, small on the left and large on the right.
  ...[
    { key: 'about.story.small', label: 'Story photo, small', guidance: 'Screens in a real place, 4:3, WebP, 1200 × 900.', file: 'retail-screens.webp' },
    { key: 'about.story.large', label: 'Story photo, large', guidance: 'Screens in a real place, 3:2, WebP, 1800 × 1200.', file: 'interactive-display.webp' },
  ].map(({ file, ...slot }) => {
    const photo = stockPhoto(file)
    return {
      ...slot,
      group: 'About photos' as const,
      fallback: photo ? { ...photo, width: 960, height: 540 } : null,
      places: [{ page: 'about', section: 'story' }],
    }
  }),
  ...USE_CASES.map((uc) => ({
    key: `use-case.${uc.slug}.cover`,
    group: 'Use case covers' as const,
    label: uc.title,
    guidance: 'Real deployment photo, 16:9, WebP, 1600 × 900 or larger.',
    fallback: { ...uc.cover, width: 960, height: 540 },
    places: [{ page: 'use-cases' }, { page: 'about', section: 'results' }],
  })),
  ...STOCK_SCREEN_IMAGES.map((img, i) => ({
    key: `screens.${i + 1}`,
    group: 'Screen photos' as const,
    label: img.alt,
    guidance: 'Screens in a real place, 16:9, WebP, 1600 × 900. Avoid third-party logos.',
    fallback: { ...img, width: 960, height: 540 },
    // The screen wall behind the home use cases section.
    places: [{ page: 'home', section: 'use-cases' }],
  })),
]

/** Page keys a slot shows on, without repeats. */
export function slotPages(slot: MediaSlot) {
  return [...new Set(slot.places.map((p) => p.page))]
}

export function slotsForPage(pageKey: string) {
  return MEDIA_SLOTS.filter((s) => s.places.some((p) => p.page === pageKey))
}

/** Slots in one section of a page; with no section, the page's slots that sit outside any section. */
export function slotsForSection(pageKey: string, section: string | undefined) {
  return MEDIA_SLOTS.filter((s) => s.places.some((p) => p.page === pageKey && p.section === section))
}

export const MEDIA_SLOT_KEYS = MEDIA_SLOTS.map((s) => s.key)

/**
 * Where a hardware photo was picked before Compatible devices became editable
 * (see src/lib/section-content.ts). Read only as a fallback until that
 * section is first saved, which clears these slots.
 */
export function hardwareSlotKey(name: string) {
  return `hardware.${slugify(name)}`
}

export const ALLOWED_IMAGE_TYPES = ['image/webp', 'image/avif', 'image/jpeg', 'image/png'] as const
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'] as const
// Videos upload straight from the browser to R2, so they are not held in a Worker's memory.
// Visitors only download one when they press play.
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024

/** Library files are images or videos; each place on the site takes one kind. */
export const isVideoAsset = (asset: { contentType: string }) => asset.contentType.startsWith('video/')
// Hard limit per file. The admin shrinks images in the browser first (src/lib/image-prepare.ts),
// so a normal photo lands well under this.
export const MAX_IMAGE_BYTES = 1024 * 1024

/** A starting alt text from a file name ("lcd-signage_02.webp" → "Lcd signage 02"); editors refine it per page. */
export function altFromFileName(name: string) {
  const words = name
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[-_.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const text = words ? words[0]?.toUpperCase() + words.slice(1) : ''
  return (text.length >= 3 ? text : 'Uploaded image').slice(0, 200)
}
