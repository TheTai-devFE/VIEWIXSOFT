/**
 * Tilted 3D wall of images drifting in three columns.
 * Adapted from emerald-ui's ThreeDMarquee (MIT, https://emerald-ui.com):
 * the drift is a CSS animation (`animate-wall-drift` in app.css) so the home
 * page does not ship Motion, and it stops moving under `prefers-reduced-motion`.
 */
import type { CSSProperties } from 'react'
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
  const chunkSize = Math.ceil(images.length / COLUMNS)
  const chunks = Array.from({ length: COLUMNS }, (_, i) => images.slice(i * chunkSize, (i + 1) * chunkSize))

  return (
    <div className={cn('mx-auto block h-140 w-full overflow-hidden rounded-md max-xl:h-120 max-sm:h-100', className)}>
      <div className="flex size-full items-center justify-center">
        <div className="aspect-square size-180 shrink-0 scale-135 max-xl:size-full max-xl:scale-110 max-sm:scale-130">
          <div
            style={{ transform: 'rotateX(45deg) rotateY(0deg) rotateZ(45deg)' }}
            className="relative top-0 right-[-55%] grid size-full origin-top-left grid-cols-3 gap-5 transform-3d max-xl:-top-30 max-xl:right-[-45%] max-sm:top-0 max-sm:gap-2"
          >
            {chunks.map((column, colIndex) => (
              <div
                key={colIndex}
                // Neighbouring columns drift in opposite directions at different speeds.
                style={
                  {
                    '--wall-drift': colIndex % 2 === 0 ? '60px' : '-60px',
                    '--wall-duration': colIndex % 2 === 0 ? '10s' : '15s',
                  } as CSSProperties
                }
                className="flex flex-col items-start gap-6 motion-safe:animate-wall-drift max-sm:gap-3"
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
