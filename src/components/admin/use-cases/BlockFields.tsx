import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { PRODUCTS } from '~/content/products'
import { cn } from '~/lib/cn'

export const textareaClass =
  'mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'

export const selectClass =
  'mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'

/** One page block in the editor: a title, an optional/required note and a writing tip for marketing. */
export function BlockCard({
  title,
  note,
  tip,
  children,
}: {
  title: string
  note?: string
  tip?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground">
          {title}
          {note && <span className="ml-2 text-xs font-normal text-muted-foreground">{note}</span>}
        </h3>
        {tip && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{tip}</p>}
      </div>
      {children}
    </section>
  )
}

/** A list of rows the editor can add to, remove from and reorder, up to `max`. */
export function RepeatableList<T>({
  label,
  items,
  max,
  blank,
  onChange,
  renderItem,
}: {
  label: string
  items: T[]
  max: number
  blank: T
  onChange: (items: T[]) => void
  renderItem: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode
}) {
  const update = (index: number) => (patch: Partial<T>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  const move = (from: number, to: number) => {
    const next = [...items]
    const [item] = next.splice(from, 1)
    if (item !== undefined) next.splice(to, 0, item)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="relative rounded-xl border border-border p-4 pr-12">
          {renderItem(item, update(index), index)}
          <div className="absolute top-3 right-3 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              aria-label={`Xoá ${label} ${index + 1}`}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 aria-hidden="true" className="size-4" />
            </button>
            {index > 0 && (
              <button
                type="button"
                onClick={() => move(index, index - 1)}
                aria-label={`Đưa ${label} ${index + 1} lên`}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
              >
                <ArrowUp aria-hidden="true" className="size-4" />
              </button>
            )}
            {index < items.length - 1 && (
              <button
                type="button"
                onClick={() => move(index, index + 1)}
                aria-label={`Đưa ${label} ${index + 1} xuống`}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
              >
                <ArrowDown aria-hidden="true" className="size-4" />
              </button>
            )}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, blank])}
        disabled={items.length >= max}
        className="inline-flex items-center gap-1 text-xs font-semibold text-signal-400 hover:text-signal-300 disabled:opacity-40"
      >
        <Plus aria-hidden="true" className="size-3.5" /> Thêm {label}
        <span className="font-normal text-muted-foreground">
          ({items.length}/{max})
        </span>
      </button>
    </div>
  )
}

/** A labelled text input; `hint` sits under the label for length or wording rules. */
export function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  multiline = false,
  rows = 3,
  className,
}: {
  id: string
  label: string
  value: string | undefined
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  multiline?: boolean
  rows?: number
  className?: string
}) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {multiline ? (
        <textarea
          id={id}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={textareaClass}
        />
      ) : (
        <Input
          id={id}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className="mt-1 text-sm"
        />
      )}
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-[11px] text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  )
}

/** Picks a Viewixsoft product, or none (hardware or anything else). */
export function ProductSelect({
  id,
  label,
  value,
  onChange,
  noneLabel,
  className,
}: {
  id: string
  label: string
  value: string | null
  onChange: (slug: string | null) => void
  noneLabel: string
  className?: string
}) {
  return (
    <div className={cn(className)}>
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} className={selectClass}>
        <option value="">{noneLabel}</option>
        {PRODUCTS.map((p) => (
          <option key={p.slug} value={p.slug}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  )
}
