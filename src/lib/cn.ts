import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Teach tailwind-merge our custom font-size tokens so `text-hero` is not
// mistaken for a text color and doesn't strip `text-ink-50`.
const twMerge = extendTailwindMerge({
  extend: { theme: { text: ['hero', 'scene'] } },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
