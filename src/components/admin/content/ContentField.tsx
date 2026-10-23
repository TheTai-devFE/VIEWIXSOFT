import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { cn } from '~/lib/cn'

/**
 * One labelled text input or textarea for the section content editors, with
 * its hint and error wired through aria-describedby. Field state stays in the
 * editor's TanStack Form; this only draws it.
 */
export function ContentField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  rows,
  srOnlyLabel = false,
  className,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  error?: string
  hint?: string
  /** Set to draw a textarea with this many rows. */
  rows?: number
  srOnlyLabel?: boolean
  className?: string
}) {
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined
  const common = {
    id,
    value,
    onBlur,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
  }
  return (
    <div className={className}>
      <Label htmlFor={id} className={cn(srOnlyLabel && 'sr-only')}>
        {label}
      </Label>
      {rows ? (
        <textarea
          {...common}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full rounded-md border border-input bg-background p-3 text-sm text-foreground aria-invalid:border-destructive',
            !srOnlyLabel && 'mt-1.5',
          )}
        />
      ) : (
        <Input
          {...common}
          onChange={(e) => onChange(e.target.value)}
          className={cn('h-9 bg-background', !srOnlyLabel && 'mt-1.5')}
        />
      )}
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
