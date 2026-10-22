import { lazy } from 'react'

// Stages for chapters 1–5 are client-only and split out of the initial bundle;
// the copy around them is SSR'd, so nothing indexable waits on these chunks.
export const ScreenWall = lazy(() =>
  import('~/components/story/primitives/ScreenWall').then((m) => ({ default: m.ScreenWall })),
)
export const TimelineScrubber = lazy(() =>
  import('~/components/story/primitives/TimelineScrubber').then((m) => ({ default: m.TimelineScrubber })),
)
export const ReceiptToMenu = lazy(() =>
  import('~/components/story/primitives/ReceiptToMenu').then((m) => ({ default: m.ReceiptToMenu })),
)
export const NfcPhoneRipple = lazy(() =>
  import('~/components/story/primitives/NfcPhoneRipple').then((m) => ({ default: m.NfcPhoneRipple })),
)
export const WorldPulseMap = lazy(() =>
  import('~/components/story/primitives/WorldPulseMap').then((m) => ({ default: m.WorldPulseMap })),
)
export const BootSequence = lazy(() =>
  import('~/components/story/primitives/BootSequence').then((m) => ({ default: m.BootSequence })),
)
