import { motion } from 'motion/react'
import { cn } from '~/lib/cn'
import { usePrefersReducedMotion } from '~/components/story/use-prefers-reduced-motion'

export type BrandList = {
  id: string
  name: string
  // Optional logo; text is rendered when there is no approved artwork.
  image?: { src: string; width: number; height: number }
  // Dev-only stand-in, drawn as a dashed box so it can't pass for a real logo.
  placeholder?: boolean
}

type BrandSliderProps = {
  label: string
  brandList: BrandList[]
}

function BrandMark({ brand, hidden }: { brand: BrandList; hidden?: boolean }) {
  if (brand.placeholder) {
    return (
      <span className="flex h-10 w-36 items-center justify-center rounded-md border border-dashed border-ink-700 font-mono text-[11px] whitespace-nowrap text-ink-500">
        {brand.name}
      </span>
    )
  }
  if (brand.image) {
    return (
      <img
        src={brand.image.src}
        alt={hidden ? '' : brand.name}
        // Shown 32 px tall; the width keeps the logo's own proportions so nothing shifts on load.
        width={Math.round((32 * brand.image.width) / brand.image.height)}
        height={32}
        className="h-8 w-auto"
        loading="lazy"
      />
    )
  }
  return (
    <span className="font-mono text-sm tracking-wide whitespace-nowrap text-muted-foreground uppercase">{brand.name}</span>
  )
}

function BrandItems({ brandList, hidden, centered }: { brandList: BrandList[]; hidden?: boolean; centered?: boolean }) {
  return (
    // The scrolling track keeps a trailing gap so the loop seam matches the gaps between logos.
    <ul aria-hidden={hidden} className={cn('flex shrink-0 items-center gap-12', centered ? 'flex-wrap justify-center gap-y-6' : 'pr-12')}>
      {brandList.map((brand) => (
        <li key={brand.id} className="shrink-0">
          <BrandMark brand={brand} hidden={hidden} />
        </li>
      ))}
    </ul>
  )
}

// The marquee repeats the row to loop, so a short list would show the same logo twice on screen.
const MIN_TO_SCROLL = 5

export function BrandSlider({ label, brandList }: BrandSliderProps) {
  const reduceMotion = usePrefersReducedMotion()
  const scroll = !reduceMotion && brandList.length >= MIN_TO_SCROLL

  return (
    // Screen readers still get a name for the strip when the visible label is turned off.
    <section aria-label={label || 'Our partners'} className="border-y border-border bg-background py-8">
      <div className="page-x">
        {label && <p className="mb-6 text-center text-sm text-muted-foreground">{label}</p>}
        {!scroll ? (
          <div className="flex flex-wrap justify-center">
            <BrandItems brandList={brandList} centered />
          </div>
        ) : (
          <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            {/* Two identical tracks: shifting by half the row loops seamlessly. */}
            <motion.div
              className="flex"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
            >
              <BrandItems brandList={brandList} />
              <BrandItems brandList={brandList} hidden />
            </motion.div>
          </div>
        )}
      </div>
    </section>
  )
}
