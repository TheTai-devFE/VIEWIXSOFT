/**
 * Tilted 3D wall of images drifting in three columns.
 * Adapted from emerald-ui's ThreeDMarquee (MIT, https://emerald-ui.com):
 * uses the repo's `motion` package and tokens, and stops moving under
 * `prefers-reduced-motion`.
 */
import { LazyMotion, domAnimation, m, useReducedMotion } from 'motion/react'
import { cn } from '~/lib/cn'

export interface MarqueeImage {
  src: string
  alt: string
}

interface ThreeDMarqueeProps {
  images: MarqueeImage[]
  className?: string
}

const COLUMNS = 3

export function ThreeDMarquee({ images, className }: ThreeDMarqueeProps) {
  const reduceMotion = useReducedMotion()
  const chunkSize = Math.ceil(images.length / COLUMNS)
  const chunks = Array.from({ length: COLUMNS }, (_, i) => images.slice(i * chunkSize, (i + 1) * chunkSize))

  return (
    <div className={cn('mx-auto block h-140 w-full overflow-hidden rounded-md max-xl:h-120 max-sm:h-100', className)}>
      <div className="flex size-full items-center justify-center">
        <div className="aspect-square size-180 shrink-0 scale-135 max-xl:size-full max-xl:scale-110 max-sm:scale-130">
          <LazyMotion features={domAnimation} strict>
            <div
              style={{ transform: 'rotateX(45deg) rotateY(0deg) rotateZ(45deg)' }}
              className="relative top-0 right-[-55%] grid size-full origin-top-left grid-cols-3 gap-5 transform-3d max-xl:-top-30 max-xl:right-[-45%] max-sm:top-0 max-sm:gap-2"
            >
              {chunks.map((column, colIndex) => (
                <m.div
                  key={colIndex}
                  animate={reduceMotion ? undefined : { y: colIndex % 2 === 0 ? 60 : -60 }}
                  transition={{ duration: colIndex % 2 === 0 ? 10 : 15, repeat: Infinity, repeatType: 'reverse' }}
                  className="flex flex-col items-start gap-6 max-sm:gap-3"
                >
                  {column.map((img, imageIndex) => (
                    <img
                      key={`${imageIndex}-${img.src}`}
                      src={img.src}
                      alt={img.alt}
                      width={400}
                      height={300}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      className="aspect-4/3 h-full w-full rounded-lg bg-ink-900 object-cover select-none"
                    />
                  ))}
                </m.div>
              ))}
            </div>
          </LazyMotion>
        </div>
      </div>
    </div>
  )
}
