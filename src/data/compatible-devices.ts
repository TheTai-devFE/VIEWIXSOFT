/**
 * Partner hardware that runs Viewixsoft CMS, shown in the home page carousel.
 *
 * Add a device only when it is tested with Viewixsoft CMS and the partner has
 * agreed in writing to the use of their logo and product photo. Put files in
 * `public/devices/` (photo: transparent PNG or WebP, ~800×600) and
 * `public/partners/` (logo: SVG preferred).
 *
 * TODO(content): add real devices. While the list is empty the section is
 * hidden in production and shows labelled placeholders in the dev server.
 */
export type DeviceCategory = 'Display' | 'Media player' | 'Kiosk' | 'Tablet' | 'Video wall' | 'LED screen'

export interface CompatibleDevice {
  /** Product name as the partner writes it, e.g. "QM55C". */
  name: string
  partner: string
  partnerLogo: string
  image: string
  category: DeviceCategory
  /** Operating system the Viewixsoft player runs on for this device. */
  os: string
}

export const COMPATIBLE_DEVICES: CompatibleDevice[] = []

/**
 * Generic screen photos for the compatible-hardware band until partner device
 * photos exist. Free under the Unsplash License, self-hosted as WebP. Picked to
 * show no third-party brands, so none of them can read as an endorsement.
 * Source: images.unsplash.com/photo-<id> (id after each path).
 */
export const STOCK_SCREEN_IMAGES: { src: string; alt: string }[] = [
  // 1759552337652-95ee2815c9c8
  { src: '/devices/stock/digital-menu-boards.webp', alt: 'Row of digital menu boards above a food counter' },
  // 1764795849694-34b3316b3de4
  { src: '/devices/stock/interactive-display.webp', alt: 'Two people using a tall interactive display in a store' },
  // 1790584163678-957ae0aad6f0
  { src: '/devices/stock/transit-display.webp', alt: 'Digital arrival board under a transit shelter' },
  // 1764795850248-97a5e986b242
  { src: '/devices/stock/retail-screens.webp', alt: 'Retail store wall with several portrait screens' },
  // 1559137781-875af01c14bc
  { src: '/devices/stock/tablet-kiosk.webp', alt: 'Tablet kiosk on a counter with a customer paying by phone' },
  // 1697206165469-9227e6e3aa0a
  { src: '/devices/stock/bar-menu-screens.webp', alt: 'Bar with a wall of digital menu screens' },
  // 1790156590226-5dc136fbf150
  { src: '/devices/stock/menu-stand.webp', alt: 'Freestanding digital menu screen in a cafeteria' },
  // 1778791672994-34708641cb9d
  { src: '/devices/stock/countertop-screen.webp', alt: 'Countertop touch screen used at a restaurant table' },
]

/**
 * Viewix hardware lines that run Viewixsoft software, shown as a card grid under
 * the screen band. Viewixsoft is the software arm of Viewix, which sells the
 * hardware.
 *
 * TODO(content): set `brand` and `image` for each line. `brand` shows under the
 * name and is hidden while empty. Use a transparent PNG or WebP,
 * about 800×800, in `public/devices/viewix/`. While `image` is empty the card
 * shows an icon placeholder.
 */
export interface HardwareLine {
  name: string
  brand: string
  image: string
}

export const VIEWIX_HARDWARE: HardwareLine[] = [
  { name: 'Floor-standing advertising display', brand: '', image: '' },
  { name: 'Touch screen kiosk', brand: '', image: '' },
  { name: 'LCD digital signage', brand: '', image: '' },
  { name: 'LED screen', brand: '', image: '' },
  { name: 'Interactive display', brand: '', image: '' },
  { name: 'Outdoor advertising display', brand: '', image: '' },
  { name: 'Tablet stand', brand: '', image: '' },
  { name: 'Tempered glass TV', brand: '', image: '' },
  { name: 'POS terminal', brand: '', image: '' },
  { name: 'LCD video wall', brand: '', image: '' },
]
