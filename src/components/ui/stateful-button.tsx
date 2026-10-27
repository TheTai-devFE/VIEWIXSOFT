// Adapted from beUI (beui.dev/components/motion/button, stateful): a button
// whose label rolls letter by letter between idle, loading, success and error,
// with a spinner, check or cross sliding in beside it. Built on our Button, so
// it keeps the brand variants, and only transform and opacity animate.
import { Check, Loader2, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { Variants } from 'motion/react'
import { useLayoutEffect, useRef, useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { Button } from '~/components/ui/button'
import { EASE_OUT, SPRING_SWAP } from '~/lib/ease'

export type ButtonState = 'idle' | 'loading' | 'success' | 'error'

export interface StatefulButtonProps extends Omit<ComponentProps<typeof Button>, 'children' | 'asChild'> {
  state?: ButtonState
  children: string
  loadingText?: string
  successText?: string
  errorText?: string
}

const STAGGER = 0.025

const LETTER: Variants = {
  initial: { opacity: 0, y: '105%' },
  animate: (delay: number = 0) => ({ opacity: 1, y: '0%', transition: { ...SPRING_SWAP, delay } }),
  exit: (delay: number = 0) => ({ opacity: 0, y: '-105%', transition: { duration: 0.16, ease: EASE_OUT, delay: delay * 0.5 } }),
}

function IconSlot({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <motion.span
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, transition: SPRING_SWAP }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.7, transition: { duration: 0.16, ease: EASE_OUT } }}
      className="inline-grid size-4 shrink-0 place-items-center"
    >
      {children}
    </motion.span>
  )
}

function RollingText({ label }: { label: string }) {
  const reduce = useReducedMotion()
  const measureRef = useRef<HTMLSpanElement>(null)
  const [width, setWidth] = useState<number>()

  // Measured with the same per-letter layout as the roll, so kerning can't clip the last glyph.
  useLayoutEffect(() => {
    const next = measureRef.current?.offsetWidth
    if (next) setWidth((current) => (current === next ? current : next))
  })

  const letters = (text: string) =>
    text.split('').map((char, i) => (
      // Position is the letter's identity within one label.
      <span key={i} className="inline-block whitespace-pre">
        {char}
      </span>
    ))

  return (
    <span className="relative inline-block overflow-hidden whitespace-nowrap align-bottom" style={{ width }}>
      <span ref={measureRef} aria-hidden="true" className="invisible inline-block whitespace-nowrap">
        {letters(label)}
      </span>
      <span className="sr-only">{label}</span>
      <AnimatePresence initial={false}>
        <motion.span
          key={label}
          aria-hidden="true"
          initial={reduce ? { opacity: 0 } : 'initial'}
          animate={reduce ? { opacity: 1 } : 'animate'}
          exit={reduce ? { opacity: 0 } : 'exit'}
          className="absolute top-0 left-0 inline-block whitespace-pre"
        >
          {reduce
            ? label
            : label.split('').map((char, i) => (
                <motion.span key={i} custom={i * STAGGER} variants={LETTER} className="inline-block whitespace-pre">
                  {char}
                </motion.span>
              ))}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export function StatefulButton({
  state = 'idle',
  children,
  loadingText = 'Loading',
  successText = 'Done',
  errorText = 'Try again',
  disabled,
  ...rest
}: StatefulButtonProps) {
  const isBusy = state === 'loading'
  const labels: Record<ButtonState, string> = {
    idle: children,
    loading: loadingText,
    success: successText,
    error: errorText,
  }

  return (
    <Button disabled={disabled || isBusy} aria-busy={isBusy} {...rest}>
      <span aria-live="polite" className="inline-flex items-center justify-center gap-2">
        <AnimatePresence initial={false} mode="popLayout">
          {state === 'loading' && (
            <IconSlot key="loading">
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
            </IconSlot>
          )}
          {state === 'success' && (
            <IconSlot key="success">
              <Check className="size-4" />
            </IconSlot>
          )}
          {state === 'error' && (
            <IconSlot key="error">
              <X className="size-4" />
            </IconSlot>
          )}
        </AnimatePresence>
        <RollingText label={labels[state]} />
      </span>
    </Button>
  )
}
