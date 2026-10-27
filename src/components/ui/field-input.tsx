// Adapted from beUI (beui.dev/components/motion/input): a labelled text field
// with icons, an error shake and a drawn success check. Colours come from the
// semantic tokens, and the shake and check skip when motion is reduced.
import { AnimatePresence, animate, motion, useReducedMotion } from 'motion/react'
import { forwardRef, useEffect, useId, useRef, useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '~/lib/cn'

export interface FieldInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label?: string
  value: string
  onChange: (value: string) => void
  /** A string shows below the field; any truthy value shakes it and turns the border red. */
  error?: string | boolean
  /** Keeps one line free for the message so the form doesn't jump when it appears. */
  reserveErrorLine?: boolean
  success?: boolean
  leftIcon?: ReactNode
  /** Usually a button, e.g. a password reveal toggle. Hidden while `success` shows. */
  rightSlot?: ReactNode
}

export const FieldInput = forwardRef<HTMLInputElement, FieldInputProps>(function FieldInput(
  {
    label,
    value,
    onChange,
    onFocus,
    onBlur,
    error,
    reserveErrorLine = false,
    success,
    leftIcon,
    rightSlot,
    className,
    disabled,
    id: idProp,
    ...rest
  },
  ref,
) {
  const reactId = useId()
  const id = idProp ?? reactId
  const reduce = useReducedMotion()
  const [focused, setFocused] = useState(false)
  const fieldRef = useRef<HTMLDivElement>(null)

  const hasError = Boolean(error)
  const errorMessage = typeof error === 'string' ? error : null
  const right = success ? null : rightSlot

  useEffect(() => {
    if (!fieldRef.current || reduce || !hasError) return
    animate(fieldRef.current, { x: [0, -6, 6, -4, 4, -2, 0] }, { duration: 0.45 })
  }, [hasError, reduce])

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="px-1 text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <div
        ref={fieldRef}
        className={cn(
          'relative h-11 overflow-hidden rounded-full border border-border bg-background transition-colors duration-200',
          focused && !hasError && 'border-foreground/40 ring-2 ring-ring/40',
          hasError && 'border-destructive ring-2 ring-destructive/25',
          disabled && 'opacity-60',
        )}
      >
        {leftIcon && (
          <span className="pointer-events-none absolute top-1/2 left-3.5 flex -translate-y-1/2 items-center text-muted-foreground [&_svg]:size-4">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={id}
          value={value}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={errorMessage ? `${id}-error` : undefined}
          {...rest}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            onBlur?.(e)
          }}
          className={cn(
            'size-full bg-transparent text-base text-foreground caret-foreground outline-none placeholder:text-muted-foreground/60',
            leftIcon ? 'pl-10' : 'pl-4',
            right || success ? 'pr-11' : 'pr-4',
            disabled && 'cursor-not-allowed',
          )}
        />

        {success ? (
          <motion.svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="absolute top-1/2 right-3.5 size-5 -translate-y-1/2 text-success"
          >
            <motion.path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </motion.svg>
        ) : (
          right && (
            <span className="absolute top-0 right-0 flex h-full items-center text-muted-foreground [&_button]:grid [&_button]:size-11 [&_button]:place-items-center [&_svg]:size-4">
              {right}
            </span>
          )
        )}
      </div>

      <div className={reserveErrorLine ? 'min-h-4' : 'contents'}>
        <AnimatePresence initial={false}>
          {errorMessage && (
            <motion.p
              id={`${id}-error`}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="px-1 text-xs text-destructive"
            >
              {errorMessage}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
})
