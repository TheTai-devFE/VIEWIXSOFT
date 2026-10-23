import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Ref } from 'react'
import { buttonSecondary } from '~/components/admin/admin-ui'
import type { EditorHandle } from '~/components/admin/admin-ui'
import { ContentField } from '~/components/admin/content/ContentField'
import { useSectionDraft } from '~/components/admin/content/use-section-draft'
import { ImagePickerSheet } from '~/components/admin/ImagePickerSheet'
import type { LibraryAsset } from '~/components/admin/ImagePickerSheet'
import { cn } from '~/lib/cn'
import type { SectionContentKey } from '~/lib/section-content'

/*
 * One editor for sections that are text plus simple lists, described by a
 * field list instead of a hand-written form per section. The section's Zod
 * schema in ~/lib/section-content validates on save, and its issues are shown
 * next to the fields they belong to.
 */

export type FieldSpec =
  /** One line, or a textarea with `rows`. */
  | { kind: 'text'; name: string; label: string; hint?: string; rows?: number; narrow?: boolean }
  /** Text items that can be added, removed and reordered: `{ id, text }[]`; `rows` for paragraphs. */
  | { kind: 'tags'; name: string; label: string; hint?: string; max: number; itemLabel: string; rows?: number }
  /** A fixed number of items whose text can change but not their count or order. */
  | {
      kind: 'fixedItems'
      name: string
      label: string
      hint?: string
      itemLabel: string
      fields: { name: string; label: string; rows?: number }[]
    }
  /** Library images with alt text: `{ id, image }[]`. */
  | { kind: 'images'; name: string; label: string; hint?: string; max: number; pickerDescription: string }

/** Where the editor grid puts a field: side by side with the next one, or full width. */
export type EditorSpec = { intro?: string; fields: (FieldSpec | [FieldSpec, FieldSpec])[] }

type Values = Record<string, unknown>
type Item = Record<string, unknown>

const str = (v: unknown) => (typeof v === 'string' ? v : '')
const items = (v: unknown): Item[] =>
  Array.isArray(v) ? v.filter((i): i is Item => typeof i === 'object' && i !== null) : []
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`

export function SectionTextEditor({
  contentKey,
  name,
  spec,
  initial,
  assets,
  ref,
  onDirtyChange,
}: {
  contentKey: SectionContentKey
  /** The section's name in messages, e.g. "Capabilities". */
  name: string
  spec: EditorSpec
  initial: Values
  assets: LibraryAsset[]
  ref?: Ref<EditorHandle>
  onDirtyChange?: (dirty: boolean) => void
}) {
  const { values, update, errorAt, idFor } = useSectionDraft<Values>({ contentKey, name, initial, ref, onDirtyChange })
  const [picking, setPicking] = useState<string | null>(null)

  const setField = (field: string, value: unknown) => update((current) => ({ ...current, [field]: value }))
  const updateList = (field: string, fn: (list: Item[]) => Item[]) =>
    update((current) => ({ ...current, [field]: fn(items(current[field])) }))
  const setItem = (field: string, index: number, patch: Item) =>
    updateList(field, (list) => list.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  const move = (field: string, from: number, to: number) =>
    updateList(field, (list) => {
      const next = [...list]
      const [moved] = next.splice(from, 1)
      if (moved) next.splice(to, 0, moved)
      return next
    })
  const removeAt = (field: string, index: number) => updateList(field, (list) => list.filter((_, i) => i !== index))

  const arrowButton = cn(buttonSecondary, 'size-7 p-0')

  const renderField = (field: FieldSpec) => {
    switch (field.kind) {
      case 'text':
        return (
          <ContentField
            key={field.name}
            id={idFor(field.name)}
            label={field.label}
            hint={field.hint}
            rows={field.rows}
            className={field.narrow ? 'max-w-xs' : undefined}
            value={str(values[field.name])}
            onChange={(v) => setField(field.name, v)}
            onBlur={() => undefined}
            error={errorAt(field.name)}
          />
        )

      case 'tags': {
        const list = items(values[field.name])
        return (
          <fieldset key={field.name}>
            <legend className="mb-1 flex w-full items-baseline justify-between text-sm font-semibold text-ink-200">
              {field.label}
              <span className="font-mono text-xs font-normal text-ink-500">
                {list.length} of {field.max}
              </span>
            </legend>
            {field.hint && <p className="mb-2 text-xs text-muted-foreground">{field.hint}</p>}
            {list.length > 0 && (
              <ol className="divide-y divide-ink-800 rounded-xl border border-ink-800">
                {list.map((item, i) => {
                  const label = `${field.itemLabel} ${i + 1}`
                  return (
                    <li key={str(item.id) || i} className="flex items-start gap-3 px-3 py-2.5">
                      <ContentField
                        id={idFor(`${field.name}.${i}.text`)}
                        label={label}
                        srOnlyLabel
                        rows={field.rows}
                        className="min-w-0 flex-1"
                        value={str(item.text)}
                        onChange={(v) => setItem(field.name, i, { text: v })}
                        onBlur={() => undefined}
                        error={errorAt(`${field.name}.${i}.text`)}
                      />
                      <div className="mt-1 flex shrink-0 gap-0.5">
                        <button type="button" onClick={() => move(field.name, i, i - 1)} disabled={i === 0} aria-label={`Move ${label} up`} className={arrowButton}>
                          <ArrowUp aria-hidden="true" className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(field.name, i, i + 1)}
                          disabled={i === list.length - 1}
                          aria-label={`Move ${label} down`}
                          className={arrowButton}
                        >
                          <ArrowDown aria-hidden="true" className="size-3.5" />
                        </button>
                        <button type="button" onClick={() => removeAt(field.name, i)} aria-label={`Remove ${label}`} className={cn(arrowButton, 'hover:text-destructive')}>
                          <Trash2 aria-hidden="true" className="size-3.5" />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
            {errorAt(field.name) && <p className="mt-2 text-xs text-destructive">{errorAt(field.name)}</p>}
            <button
              type="button"
              disabled={list.length >= field.max}
              onClick={() => updateList(field.name, (current) => [...current, { id: newId(field.name), text: '' }])}
              className={cn(buttonSecondary, 'mt-3')}
            >
              <Plus aria-hidden="true" className="size-4" />
              Add {field.itemLabel.toLowerCase()}
            </button>
          </fieldset>
        )
      }

      case 'fixedItems': {
        const list = items(values[field.name])
        return (
          <fieldset key={field.name}>
            <legend className="mb-1 text-sm font-semibold text-ink-200">{field.label}</legend>
            {field.hint && <p className="mb-2 text-xs text-muted-foreground">{field.hint}</p>}
            <ol className="space-y-3">
              {list.map((item, i) => (
                <li key={str(item.id) || i} className="rounded-xl border border-ink-800 p-4">
                  <p className="mb-3 font-mono text-xs text-ink-500">
                    {field.itemLabel} {i + 1}
                  </p>
                  <div className="space-y-3">
                    {field.fields.map((f) => (
                      <ContentField
                        key={f.name}
                        id={idFor(`${field.name}.${i}.${f.name}`)}
                        label={f.label}
                        rows={f.rows}
                        value={str(item[f.name])}
                        onChange={(v) => setItem(field.name, i, { [f.name]: v })}
                        onBlur={() => undefined}
                        error={errorAt(`${field.name}.${i}.${f.name}`)}
                      />
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </fieldset>
        )
      }

      case 'images': {
        const list = items(values[field.name])
        return (
          <fieldset key={field.name}>
            <legend className="mb-1 flex w-full items-baseline justify-between text-sm font-semibold text-ink-200">
              {field.label}
              <span className="font-mono text-xs font-normal text-ink-500">
                {list.length} of {field.max}
              </span>
            </legend>
            {field.hint && <p className="mb-2 text-xs text-muted-foreground">{field.hint}</p>}
            {list.length > 0 && (
              <ol className="divide-y divide-ink-800 rounded-xl border border-ink-800">
                {list.map((item, i) => {
                  const image = typeof item.image === 'object' && item.image !== null ? (item.image as Item) : {}
                  const label = `photo ${i + 1}`
                  return (
                    <li key={str(item.id) || i} className="flex items-start gap-3 px-3 py-2.5">
                      <img
                        src={str(image.url)}
                        alt=""
                        width={Number(image.width) || undefined}
                        height={Number(image.height) || undefined}
                        className="aspect-video w-24 shrink-0 rounded-md border border-ink-800 bg-ink-950 object-cover"
                      />
                      <ContentField
                        id={idFor(`${field.name}.${i}.image.alt`)}
                        label={`Alt text for ${label}`}
                        srOnlyLabel
                        className="min-w-0 flex-1"
                        value={str(image.alt)}
                        onChange={(v) => setItem(field.name, i, { image: { ...image, alt: v } })}
                        onBlur={() => undefined}
                        error={errorAt(`${field.name}.${i}.image.alt`)}
                      />
                      <div className="mt-1 flex shrink-0 gap-0.5">
                        <button type="button" onClick={() => move(field.name, i, i - 1)} disabled={i === 0} aria-label={`Move ${label} up`} className={arrowButton}>
                          <ArrowUp aria-hidden="true" className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(field.name, i, i + 1)}
                          disabled={i === list.length - 1}
                          aria-label={`Move ${label} down`}
                          className={arrowButton}
                        >
                          <ArrowDown aria-hidden="true" className="size-3.5" />
                        </button>
                        <button type="button" onClick={() => removeAt(field.name, i)} aria-label={`Remove ${label}`} className={cn(arrowButton, 'hover:text-destructive')}>
                          <Trash2 aria-hidden="true" className="size-3.5" />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
            {errorAt(field.name) && <p className="mt-2 text-xs text-destructive">{errorAt(field.name)}</p>}
            <button
              type="button"
              disabled={list.length >= field.max}
              onClick={() => setPicking(field.name)}
              className={cn(buttonSecondary, 'mt-3')}
            >
              <ImagePlus aria-hidden="true" className="size-4" />
              Add photo
            </button>
            <ImagePickerSheet
              open={picking === field.name}
              onClose={() => setPicking(null)}
              assets={assets}
              currentId={null}
              description={field.pickerDescription}
              onPick={(a) =>
                updateList(field.name, (list) => [
                  ...list,
                  { id: newId('photo'), image: { assetId: a.id, url: a.url, width: a.width, height: a.height, alt: a.alt } },
                ])
              }
            />
          </fieldset>
        )
      }
    }
  }

  return (
    // Enter in a field saves through the header button's handler, not a second path.
    <form noValidate onSubmit={(e) => e.preventDefault()} className="space-y-5">
      {spec.intro && <p className="rounded-lg bg-ink-950 px-3 py-2 text-xs text-ink-400">{spec.intro}</p>}
      {spec.fields.map((entry) =>
        Array.isArray(entry) ? (
          <div key={entry.map((f) => f.name).join('+')} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            {entry.map(renderField)}
          </div>
        ) : (
          renderField(entry)
        ),
      )}
    </form>
  )
}
