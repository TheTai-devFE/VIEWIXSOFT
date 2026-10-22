import { TiltedGridHero } from '~/components/ui/tilted-grid-hero'
import type { TiltedGridImage } from '~/components/ui/tilted-grid-hero'
import { COMPATIBLE_DEVICES, STOCK_SCREEN_IMAGES } from '~/data/compatible-devices'

/** Partner device photos once there are any; generic screen photos until then. */
function bandImages(): TiltedGridImage[] {
  const devices = COMPATIBLE_DEVICES.filter((d) => d.image)
  if (devices.length > 0) return devices.map((d) => ({ src: d.image, alt: `${d.partner} ${d.name}` }))
  return STOCK_SCREEN_IMAGES
}

/** Curved band of real-world screens, shown on the Viewixsoft CMS page. */
export function ScreenBandSection() {
  return (
    <section aria-labelledby="screen-band-title">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">Where it runs</p>
        <h2
          id="screen-band-title"
          className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance text-ink-50 sm:text-4xl"
        >
          What screens can run Viewixsoft CMS?
        </h2>
        <p className="mt-4 text-pretty text-ink-400">
          Viewixsoft CMS runs on menu boards, retail displays, interactive kiosks, tablets and transit screens, so
          one dashboard can control every screen type in your network.
        </p>
      </div>

      {/* The band gets its own frame below the copy: its curled ends swell
          vertically and would otherwise run into the title. */}
      <TiltedGridHero
        images={bandImages()}
        tileHeight={44}
        axis={52}
        curve={72}
        speed={5}
        className="mt-4 h-72 w-full sm:h-96 lg:h-[30rem]"
      />
    </section>
  )
}
