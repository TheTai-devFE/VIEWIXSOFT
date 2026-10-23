import { TiltedGridHero } from '~/components/ui/tilted-grid-hero'
import type { TiltedGridImage } from '~/components/ui/tilted-grid-hero'
import { COMPATIBLE_DEVICES, STOCK_SCREEN_IMAGES } from '~/data/compatible-devices'
import { useSectionContent } from '~/lib/use-section-content'
import { SectionHeading } from '~/components/blocks/SectionHeading'

/** Partner device photos once there are any; generic screen photos until then. */
function bandImages(): TiltedGridImage[] {
  const devices = COMPATIBLE_DEVICES.filter((d) => d.image)
  if (devices.length > 0) return devices.map((d) => ({ src: d.image, alt: `${d.partner} ${d.name}` }))
  return STOCK_SCREEN_IMAGES
}

/** Curved band of real-world screens, shown on the Viewixsoft CMS page. Photos picked in /admin/pages win. */
export function ScreenBandSection() {
  const { eyebrow, title, description, images } = useSectionContent('product-cms:screens')
  const picked = images.map(({ image }) => ({ src: image.url, alt: image.alt }))
  return (
    <section aria-labelledby="screen-band-title">
      <SectionHeading id="screen-band-title" eyebrow={eyebrow} title={title} description={description} />

      {/* The band gets its own frame below the copy: its curled ends swell
          vertically and would otherwise run into the title. */}
      <TiltedGridHero
        images={picked.length > 0 ? picked : bandImages()}
        tileHeight={44}
        axis={52}
        curve={72}
        speed={5}
        className="mt-4 h-72 w-full sm:h-96 lg:h-[30rem]"
      />
    </section>
  )
}
