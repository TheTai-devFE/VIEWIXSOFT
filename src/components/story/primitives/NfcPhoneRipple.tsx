import { m, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { Nfc, Wallet } from 'lucide-react'
import type { NfcChannel } from '~/components/story/story-content'
import { Screen } from '~/components/story/primitives/Screen'

const RIPPLES = [0, 1, 2]

/**
 * Chapter 4: a phone approaches the screen's NFC hotspot, field rings spread,
 * the phone buzzes and a pass slides up. The interaction counter ticks +1.
 * Progress windows: 0.1–0.5 approach · 0.5–0.72 rings · 0.72–0.76 haptic · 0.74–0.86 pass.
 */
export function NfcPhoneRipple({ progress, channel }: { progress: MotionValue<number>; channel: NfcChannel }) {
  const phoneLeft = useTransform(progress, [0.1, 0.5], ['76%', '53%'])
  const phoneTop = useTransform(progress, [0.1, 0.5], ['40%', '14%'])
  const phoneRotate = useTransform(progress, [0.1, 0.5], [14, -8])
  const haptic = useTransform(progress, [0.72, 0.73, 0.74, 0.75, 0.76], [0, -4, 4, -3, 0])
  const pass = useTransform(progress, [0.74, 0.86], ['110%', '0%'])
  const counterOld = useTransform(progress, [0.74, 0.78], [1, 0])
  const counterNew = useTransform(progress, [0.76, 0.8], [0, 1])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-ink-800 bg-ink-950">
      <Screen className="absolute left-[5%] top-[5%] h-[90%] w-[58%]" displayClassName="bg-ink-900">
        <div className="absolute inset-0 flex flex-col p-[7%]">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-light-nfc sm:text-[10px]">{channel.label}</p>
              <p className="mt-2 font-display text-base font-semibold leading-tight text-ink-50 sm:text-2xl">{channel.screenTitle}</p>
            </div>
            {/* NFC hotspot: the phone lands here */}
            <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-light-nfc text-light-nfc sm:h-14 sm:w-14">
              <Nfc className="h-5 w-5 sm:h-6 sm:w-6" />
              {RIPPLES.map((r) => (
                <Ripple key={r} progress={progress} start={0.5 + r * 0.05} />
              ))}
            </div>
          </div>

          <div className="relative mt-4 flex-1 overflow-hidden rounded-sm border border-ink-700 bg-ink-850">
            <span className="absolute -bottom-1/4 -left-1/4 aspect-square w-3/4 rounded-full border border-light-nfc/40" />
            <span className="absolute -bottom-1/3 left-1/4 aspect-square w-3/4 rounded-full border border-ink-600" />
            <span className="absolute left-[8%] top-[8%] font-display text-2xl font-semibold text-ink-700 sm:text-5xl">NEW</span>
            <span className="absolute bottom-[8%] right-[8%] font-mono text-[8px] uppercase tracking-[0.18em] text-light-nfc sm:text-[10px]">
              Tap to unlock →
            </span>
          </div>

          <p className="mt-3 font-mono text-[7px] leading-relaxed tracking-[0.12em] text-ink-400 sm:text-[9px]">
            TOTAL INTERACTIONS
            <span className="relative block h-4 text-[11px] text-ink-50 sm:text-sm">
              <m.span className="absolute inset-0" style={{ opacity: counterOld }}>14,892</m.span>
              <m.span className="absolute inset-0 text-light-nfc" style={{ opacity: counterNew }}>14,893 (+1)</m.span>
            </span>
          </p>
        </div>
      </Screen>

      <m.div
        className="absolute w-[24%] max-w-36"
        style={{ left: phoneLeft, top: phoneTop, rotate: phoneRotate }}
      >
        <m.div style={{ x: haptic }} className="aspect-[9/18] rounded-[0.9rem] border border-ink-600 bg-ink-800 p-1">
          <div className="relative h-full overflow-hidden rounded-[0.65rem] bg-ink-950">
            <span className="absolute left-1/2 top-1 h-1 w-6 -translate-x-1/2 rounded-full bg-ink-800" />
            <m.div
              style={{ y: pass }}
              className="absolute inset-x-1 bottom-1 rounded-md border border-light-nfc bg-ink-900 p-1.5 sm:p-2"
            >
              <Wallet className="h-3 w-3 text-light-nfc" />
              <p className="mt-1 text-[8px] font-semibold leading-tight text-ink-50 sm:text-[11px]">{channel.passTitle}</p>
              <p className="mt-0.5 text-[6px] leading-tight text-ink-400 sm:text-[8px]">{channel.passDetail}</p>
              <p className="mt-1 font-mono text-[6px] uppercase tracking-wider text-light-nfc sm:text-[7px]">Saved to wallet</p>
            </m.div>
          </div>
        </m.div>
      </m.div>
    </div>
  )
}

function Ripple({ progress, start }: { progress: MotionValue<number>; start: number }) {
  const scale = useTransform(progress, [start, start + 0.14], [1, 3.2])
  const opacity = useTransform(progress, [start, start + 0.02, start + 0.14], [0, 0.9, 0])
  return <m.span style={{ scale, opacity }} className="absolute inset-0 rounded-full border border-light-nfc" />
}
