import { motion } from 'motion/react'
import { usePrefersReducedMotion } from '~/components/story/use-prefers-reduced-motion'

export type BrandList = {
  name: string
  // Optional logo; text is rendered when there is no approved artwork.
  image?: string
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
        src={brand.image}
        alt={hidden ? '' : brand.name}
        height={32}
        className="h-8 w-auto opacity-70 grayscale transition-opacity hover:opacity-100 hover:grayscale-0"
        loading="lazy"
      />
    )
  }
  return (
    <span className="font-mono text-sm tracking-wide whitespace-nowrap text-muted-foreground uppercase">{brand.name}</span>
  )
}

function BrandItems({ brandList, hidden }: { brandList: BrandList[]; hidden?: boolean }) {
  return (
    <ul aria-hidden={hidden} className="flex shrink-0 items-center gap-12 pr-12">
      {brandList.map((brand) => (
        <li key={brand.name} className="shrink-0">
          <BrandMark brand={brand} hidden={hidden} />
        </li>
      ))}
    </ul>
  )
}

export function BrandSlider({ label, brandList }: BrandSliderProps) {
  const reduceMotion = usePrefersReducedMotion()

  return (
    <section aria-label={label} className="border-y border-border bg-background py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-6 text-center text-sm text-muted-foreground">{label}</p>
        {reduceMotion ? (
          <div className="flex flex-wrap justify-center">
            <BrandItems brandList={brandList} />
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
