import { m, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'
import type { PosChannel } from '~/components/story/story-content'
import { Screen } from '~/components/story/primitives/Screen'

/**
 * Chapter 3: a cashier edits a price on the POS, the receipt prints, the
 * update flies across the room and the menu board flips to the new price.
 * Progress windows: 0.18–0.32 edit · 0.3–0.48 print · 0.48–0.72 fly · 0.72–0.8 flip.
 */
export function ReceiptToMenu({ progress, channel }: { progress: MotionValue<number>; channel: PosChannel }) {
  const editOld = useTransform(progress, [0.18, 0.26], [1, 0])
  const editNew = useTransform(progress, [0.22, 0.3], [0, 1])
  const buttonPress = useTransform(progress, [0.26, 0.3, 0.34], [1, 0.92, 1])
  const receipt = useTransform(progress, [0.3, 0.48], ['0%', '100%'])

  const flyLeft = useTransform(progress, [0.48, 0.72], ['14%', '60%'])
  const flyTop = useTransform(progress, [0.48, 0.6, 0.72], ['78%', '30%', '24%'])
  const flyScale = useTransform(progress, [0.48, 0.6, 0.72], [0.9, 1.1, 0.7])
  const flyOpacity = useTransform(progress, [0.46, 0.5, 0.7, 0.74], [0, 1, 1, 0])

  const oldFlip = useTransform(progress, [0.72, 0.76], [0, 90])
  const newFlip = useTransform(progress, [0.76, 0.8], [-90, 0])
  const highlight = useTransform(progress, [0.72, 0.78, 0.95], [0, 1, 0.35])
  const telemetry = useTransform(progress, [0.8, 0.86], [0, 1])

  return (
    <div className="relative grid h-full w-full grid-cols-[2fr_3fr] items-center gap-3 rounded-lg border border-ink-800 bg-ink-950 p-3 sm:gap-5 sm:p-5">
      {/* Counter: POS terminal + thermal printer */}
      <div className="flex flex-col justify-center gap-3">
        <div className="rounded-md border border-ink-700 bg-ink-850 p-2 sm:p-3">
          <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-ink-500 sm:text-[10px]">POS · Register 02</p>
          <p className="mt-2 truncate text-[10px] text-ink-200 sm:text-xs">{channel.item}</p>
          <div className="relative mt-1 h-7 rounded-sm border border-ink-600 bg-ink-950 font-mono text-sm text-ink-50 sm:h-9 sm:text-lg">
            <m.span className="absolute inset-0 flex items-center px-2" style={{ opacity: editOld }}>
              {channel.oldPrice}
            </m.span>
            <m.span className="absolute inset-0 flex items-center px-2 text-light-pos" style={{ opacity: editNew }}>
              {channel.newPrice}
            </m.span>
          </div>
          <m.span
            style={{ scale: buttonPress }}
            className="mt-2 block rounded-sm bg-light-pos py-1 text-center font-mono text-[9px] font-semibold uppercase tracking-wider text-ink-950 sm:text-[10px]"
          >
            Update price
          </m.span>
        </div>

        <div className="relative">
          <div className="relative z-10 h-4 rounded-sm border border-ink-700 bg-ink-800" />
          <div className="mx-auto h-20 w-[80%] overflow-hidden sm:h-28">
            <m.div
              style={{ height: receipt }}
              className="bg-ink-100 px-2 py-1.5 font-mono text-[7px] leading-relaxed text-ink-900 sm:text-[9px]"
            >
              <p>PRICE CHANGE · REG 02</p>
              <p>{channel.item.toUpperCase()}</p>
              <p className="line-through opacity-60">{channel.oldPrice}</p>
              <p className="font-semibold">{channel.newPrice}</p>
              <p className="opacity-60">-----------------</p>
            </m.div>
          </div>
        </div>
      </div>

      {/* Menu board */}
      <Screen className="aspect-4/5 max-h-full w-full" displayClassName="bg-ink-900">
        <div className="absolute inset-0 flex flex-col p-[6%]">
          <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-light-pos sm:text-[10px]">Menu · {channel.label}</p>
          <ul className="mt-3 flex-1 space-y-2 sm:mt-5 sm:space-y-3">
            <li className="relative flex items-baseline justify-between gap-2 border-b border-ink-700 pb-1.5">
              <m.span style={{ opacity: highlight }} className="absolute -inset-x-1.5 -inset-y-1 rounded-sm bg-light-pos/15" />
              <span className="relative truncate text-[11px] font-semibold text-ink-50 sm:text-base">{channel.item}</span>
              <span className="relative inline-grid font-mono text-[11px] text-light-pos [perspective:400px] sm:text-base">
                <m.span style={{ rotateX: oldFlip }} className="col-start-1 row-start-1 [backface-visibility:hidden]">
                  {channel.oldPrice}
                </m.span>
                <m.span style={{ rotateX: newFlip }} className="col-start-1 row-start-1 [backface-visibility:hidden]">
                  {channel.newPrice}
                </m.span>
              </span>
            </li>
            {channel.others.map((o) => (
              <li key={o.name} className="flex items-baseline justify-between gap-2 border-b border-ink-800 pb-1.5">
                <span className="truncate text-[10px] text-ink-300 sm:text-sm">{o.name}</span>
                <span className="font-mono text-[10px] text-ink-300 sm:text-sm">{o.price}</span>
              </li>
            ))}
          </ul>
          <m.p
            style={{ opacity: telemetry }}
            className="self-start rounded-sm border border-signal-500 px-2 py-1 font-mono text-[8px] tracking-[0.14em] text-signal-400 sm:text-[10px]"
          >
            POS TELEMETRY: 0 DISCREPANCIES
          </m.p>
        </div>
      </Screen>

      {/* The update in flight */}
      <m.span
        style={{ left: flyLeft, top: flyTop, scale: flyScale, opacity: flyOpacity }}
        className="absolute z-20 whitespace-nowrap rounded-sm border border-light-pos bg-ink-950 px-2 py-1 font-mono text-[9px] text-light-pos sm:text-[11px]"
      >
        [PRICE UPDATE: {channel.newPrice}]
      </m.span>
    </div>
  )
}
