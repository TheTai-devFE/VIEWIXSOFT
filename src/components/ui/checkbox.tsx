// Adapted from beUI (beui.dev/components/motion/checkbox): a checkbox with a
// drawn checkmark and press feedback. Colours come from the semantic tokens;
// the draw and press skip when motion is reduced.
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useId } from 'react'
import { EASE_OUT, SPRING_PRESS } from '~/lib/ease'
import { cn } from '~/lib/cn'

const CHECK_PATH = 'M5 13l4 4L19 7'

export interface CheckboxProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  /** Supporting text under the label, announced as the description rather than the name. */
  description?: string
  className?: string
  id?: string
  'aria-label'?: string
}

export function Checkbox({ checked, onCheckedChange, disabled, label, description, className, id: idProp, 'aria-label': ariaLabel }: CheckboxProps) {
  const autoId = useId()
  const id = idProp ?? autoId
  const reduce = useReducedMotion()
  const descriptionId = description ? `${id}-description` : undefined
  // The wrapping <label> would fold the description into the name, so name from the label text alone.
  const labelId = description && label && !ariaLabel ? `${id}-label` : undefined

  return (
    <label htmlFor={id} className={cn('inline-flex gap-3', description ? 'items-start' : 'items-center', disabled ? 'cursor-not-allowed' : 'cursor-pointer', className)}>
      <motion.button
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={ariaLabel}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange(!checked)}
        whileTap={reduce || disabled ? undefined : { scale: 0.92 }}
        transition={SPRING_PRESS}
        data-state={checked ? 'checked' : 'unchecked'}
        className={cn(
          'inline-flex size-5 shrink-0 items-center justify-center rounded-md border-2 outline-none transition-colors duration-200',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-60',
          description && 'mt-0.5',
          checked ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/50 bg-background hover:border-muted-foreground',
        )}
      >
        <AnimatePresence initial={false}>
          {checked && (
            <motion.svg
              key="checked"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
              transition={reduce ? { duration: 0 } : { duration: 0.16, ease: EASE_OUT }}
            >
              <motion.path
                d={CHECK_PATH}
                initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={reduce ? { duration: 0 } : { duration: 0.3, ease: EASE_OUT, delay: 0.04 }}
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>
      {(label || description) && (
        <span className={cn('flex min-w-0 flex-col gap-0.5 select-none', disabled && 'opacity-60')}>
          {label && (
            <span id={labelId} className="text-sm font-medium text-foreground">
              {label}
            </span>
          )}
          {description && (
            <span id={descriptionId} className="text-xs text-muted-foreground">
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  )
}
