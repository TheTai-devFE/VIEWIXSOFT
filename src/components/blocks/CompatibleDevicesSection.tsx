import { MonitorSmartphone } from 'lucide-react'
import { useRef } from 'react'
import type { CSSProperties, PointerEvent } from 'react'
import { Reveal } from '~/components/ui/reveal'
import { hardwareSlotKey } from '~/data/media-slots'
import { cn } from '~/lib/cn'
import { balancedGridClass } from '~/lib/section-content'
import type { DevicesContent } from '~/lib/section-content'
import { imageUrl, useMedia } from '~/lib/use-media'
import { useSectionContent } from '~/lib/use-section-content'
import { useSiteConfig } from '~/lib/use-site-config'

export function CompatibleDevicesSection() {
  // Edited in /admin/pages → Home → Compatible devices.
  const { eyebrow, title, description, items } = useSectionContent('home:devices')
  const { content } = useSiteConfig()
  const edited = 'home:devices' in content
  const columns = balancedColumnsFor(items.length)
  return (
    <section aria-labelledby="devices-title" className="border-t border-ink-800 bg-ink-950">
      <div className="page-x section-y">
        <Reveal className="mx-auto max-w-2xl text-center">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2
            id="devices-title"
            className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance text-ink-50 sm:text-4xl"
          >
            {title}
          </h2>
          {description && <p className="mt-4 text-pretty text-ink-400">{description}</p>}
        </Reveal>

        <ul className={cn('mx-auto mt-12 grid grid-cols-2 gap-3 sm:gap-4', columns.grid, columns.maxWidth)}>
          {items.map((item, i) => (
            <li key={item.id}>
              {/* Delay by column so each row sweeps left to right. */}
              <Reveal delay={(i % 5) * 70} className="h-full">
                <HardwareCard item={item} index={i} legacyFallback={!edited} />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Fewer cards stay card-sized instead of stretching across the page. */
function balancedColumnsFor(count: number) {
  const widths: Record<number, string> = { 1: 'max-w-56', 2: 'max-w-md', 3: 'max-w-2xl', 4: 'max-w-4xl', 5: 'max-w-5xl' }
  return { grid: balancedGridClass(count), maxWidth: widths[count] ?? 'max-w-6xl' }
}

const TILT_DEG = 7

/**
 * Follows the pointer: tilts the card in 3D and moves a soft glow under the
 * cursor. Writes CSS variables straight to the element, so moving the mouse
 * never re-renders React. Mouse only, and off with reduced motion.
 */
function usePointerTilt() {
  const ref = useRef<HTMLElement>(null)
  const set = (vars: Record<string, string>) => {
    for (const [k, v] of Object.entries(vars)) ref.current?.style.setProperty(k, v)
  }
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    set({
      '--ry': `${((x - 0.5) * TILT_DEG * 2).toFixed(2)}deg`,
      '--rx': `${((0.5 - y) * TILT_DEG * 2).toFixed(2)}deg`,
      '--gx': `${(x * r.width).toFixed(0)}px`,
      '--gy': `${(y * r.height).toFixed(0)}px`,
    })
  }
  const onPointerLeave = () => set({ '--rx': '0deg', '--ry': '0deg' })
  return { ref, onPointerMove, onPointerLeave }
}

function HardwareCard({
  item,
  index,
  legacyFallback,
}: {
  item: DevicesContent['items'][number]
  index: number
  legacyFallback: boolean
}) {
  // Before the section is first saved, photos picked in the old per-slot image editor still show.
  const legacy = useMedia(hardwareSlotKey(item.name))
  let image = legacyFallback ? legacy : null
  if (item.image) image = { src: item.image.url, alt: item.image.alt, width: item.image.width, height: item.image.height }
  const tilt = usePointerTilt()
  // Offsets the float so the row bobs like a wave instead of in unison.
  const float = { animationDelay: `${(index % 6) * -0.7}s` } satisfies CSSProperties

  return (
    <article
      ref={tilt.ref}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      style={{ '--rx': '0deg', '--ry': '0deg', '--gx': '50%', '--gy': '30%' } as CSSProperties}
      className="group h-full [perspective:900px]"
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink-800 bg-ink-900 transition-transform duration-(--duration-base) ease-(--ease-broadcast) [transform:rotateX(var(--rx))_rotateY(var(--ry))] motion-safe:group-hover:[transform:translateY(-4px)_rotateX(var(--rx))_rotateY(var(--ry))]">
        {/* Hover outline fades in (opacity only) instead of animating the border colour. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 rounded-2xl border border-signal-500/60 opacity-0 transition-opacity duration-(--duration-base) group-hover:opacity-100"
        />

        <div className="relative aspect-square overflow-hidden bg-stage">
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,var(--color-stage-glow),transparent_68%)]"
          />
          {/* Violet glow that follows the cursor; moved with transform, shown with opacity. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 size-40 [transform:translate(calc(var(--gx)-50%),calc(var(--gy)-50%))] rounded-full bg-[radial-gradient(closest-side,var(--color-signal-500),transparent)] opacity-0 transition-opacity duration-(--duration-base) group-hover:opacity-25"
          />

          {image ? (
            <>
              <span
                aria-hidden="true"
                style={float}
                className="absolute inset-x-[24%] bottom-[10%] h-4 rounded-[50%] bg-[radial-gradient(closest-side,var(--color-stage-shadow),transparent)] motion-safe:animate-float-shadow"
              />
              {/* The blend sits on the animated wrapper: its transform isolates anything inside it,
                  so a blend on the img would only mix with the wrapper, not the stage. */}
              <div style={float} className="relative size-full mix-blend-multiply motion-safe:animate-float">
                <img
                  src={imageUrl(image.src, 400)}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-contain p-[16%] transition-transform duration-(--duration-slow) ease-(--ease-broadcast) motion-safe:group-hover:scale-110"
                />
              </div>
            </>
          ) : (
            <span className="relative flex size-full items-center justify-center p-[20%]">
              <span className="flex size-full items-center justify-center rounded-xl border border-dashed border-stage-line text-stage-ink">
                <MonitorSmartphone aria-hidden="true" className="size-8" />
              </span>
            </span>
          )}

          {/* Light streak that sweeps across the stage on hover. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-linear-to-r from-transparent via-stage-glow/70 to-transparent opacity-0 transition-[translate,opacity] duration-700 ease-(--ease-broadcast) group-hover:translate-x-[450%] group-hover:opacity-100 motion-reduce:hidden"
          />
        </div>

        <div className="border-t border-ink-800 px-3 py-3 text-center">
          <h3 className="font-display text-sm font-semibold text-balance text-ink-50">{item.name}</h3>
          {item.brand && <p className="mt-0.5 text-xs text-ink-400">{item.brand}</p>}
        </div>
      </div>
    </article>
  )
}
