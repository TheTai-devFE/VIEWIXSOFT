// Shared motion curves for Motion-driven components (from beUI).
export const EASE_OUT = [0.16, 1, 0.3, 1] as const

/** Content swaps: labels and icons trading places inside a control. */
export const SPRING_SWAP = { type: 'spring', stiffness: 460, damping: 30, mass: 0.55 } as const

/** Shared-layout glides: pills and indicators moving between positions. */
export const SPRING_LAYOUT = { type: 'spring', stiffness: 360, damping: 32, mass: 0.6 } as const

/** Overlay panels entering: dialogs and toasts. */
export const SPRING_PANEL = { type: 'spring', stiffness: 420, damping: 40, mass: 0.5 } as const
