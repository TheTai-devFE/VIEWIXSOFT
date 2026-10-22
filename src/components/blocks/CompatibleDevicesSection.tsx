import { MonitorSmartphone } from 'lucide-react'
import { VIEWIX_HARDWARE } from '~/data/compatible-devices'
import type { HardwareLine } from '~/data/compatible-devices'
import { Reveal } from '~/components/ui/reveal'
import { hardwareSlotKey } from '~/data/media-slots'
import { imageUrl, useMedia } from '~/lib/use-media'

export function CompatibleDevicesSection() {
  return (
    <section aria-labelledby="devices-title" className="border-t border-ink-800 bg-ink-950">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Compatible hardware</p>
          <h2
            id="devices-title"
            className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance text-ink-50 sm:text-4xl"
          >
            Viewix hardware, ready for Viewixsoft
          </h2>
          <p className="mt-4 text-pretty text-ink-400">
            Viewixsoft builds the software that runs on Viewix screens, from kiosks and LED screens to POS
            terminals and video walls.
          </p>
        </Reveal>

        <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {VIEWIX_HARDWARE.map((h, i) => (
            <li key={h.name}>
              {/* Delay by column so each row sweeps left to right. */}
              <Reveal delay={(i % 5) * 70} className="h-full">
                <HardwareCard line={h} />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function HardwareCard({ line }: { line: HardwareLine }) {
  // Photos are uploaded in /admin/media; until then the card shows a placeholder.
  const image = useMedia(hardwareSlotKey(line.name))
  return (
    <article className="flex h-full flex-col items-center rounded-2xl border border-ink-800 bg-ink-900 p-4 text-center sm:p-5">
      <div className="flex aspect-square w-full max-w-40 items-center justify-center">
        {image ? (
          <img
            src={imageUrl(image.src, 400)}
            alt={image.alt}
            width={image.width}
            height={image.height}
            loading="lazy"
            decoding="async"
            className="size-full object-contain"
          />
        ) : (
          <span className="flex size-full items-center justify-center rounded-xl border border-dashed border-ink-700 text-ink-600">
            <MonitorSmartphone aria-hidden="true" className="size-10" />
          </span>
        )}
      </div>
      <h3 className="mt-4 font-display text-sm font-semibold text-balance text-ink-50 sm:text-base">{line.name}</h3>
      {line.brand && <p className="mt-1 text-xs text-ink-400">{line.brand}</p>}
    </article>
  )
}
