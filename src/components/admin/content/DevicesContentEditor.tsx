import { revalidateLogic, useForm, useStore } from '@tanstack/react-form'
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2 } from 'lucide-react'
import { useImperativeHandle, useRef, useState } from 'react'
import type { Ref } from 'react'
import { buttonSecondary, firstError } from '~/components/admin/admin-ui'
import type { EditorHandle, SaveResult } from '~/components/admin/admin-ui'
import { ImagePickerSheet } from '~/components/admin/ImagePickerSheet'
import type { LibraryAsset } from '~/components/admin/ImagePickerSheet'
import { useReportDirty } from '~/hooks/use-save-all'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { hardwareSlotKey } from '~/data/media-slots'
import { cn } from '~/lib/cn'
import { DevicesContentSchema, resolveSectionContent, SECTION_CONTENT } from '~/lib/section-content'
import type { DevicesContent, Json } from '~/lib/section-content'
import { saveSectionContentFn } from '~/server/functions/site-admin'

const KEY = 'home:devices'
const DEFAULTS = SECTION_CONTENT[KEY].defaults
const MAX_ITEMS = 15

/**
 * Starting values: the saved content, else the defaults with any hardware
 * photo picked in the old per-slot image editor, so nothing already chosen is lost.
 */
export function initialDevicesContent(
  stored: Json | undefined,
  slots: { key: string; assetId: string; alt: string }[],
  assets: LibraryAsset[],
): DevicesContent {
  if (stored !== undefined) return resolveSectionContent(KEY, stored)
  const byId = new Map(assets.map((a) => [a.id, a]))
  return {
    ...DEFAULTS,
    items: DEFAULTS.items.map((item) => {
      const slot = slots.find((s) => s.key === hardwareSlotKey(item.name))
      const asset = slot ? byId.get(slot.assetId) : undefined
      if (!slot || !asset) return item
      return { ...item, image: { assetId: asset.id, url: asset.url, width: asset.width, height: asset.height, alt: slot.alt } }
    }),
  }
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** Heading text and the device cards of the home page's Compatible devices section. */
export function DevicesContentEditor({
  initial,
  assets,
  ref,
  onDirtyChange,
}: {
  initial: DevicesContent
  assets: LibraryAsset[]
  ref?: Ref<EditorHandle>
  onDirtyChange?: (dirty: boolean) => void
}) {
  const result = useRef<SaveResult | null>(null)
  const [picking, setPicking] = useState<number | null>(null)

  const form = useForm({
    defaultValues: initial,
    validationLogic: revalidateLogic({ mode: 'submit', modeAfterSubmission: 'change' }),
    validators: { onDynamic: DevicesContentSchema },
    onSubmit: async ({ value }) => {
      try {
        // Content equal to the defaults is stored as "no override", so later code changes still show.
        const content = same(value, DEFAULTS) ? null : value
        const res = await saveSectionContentFn({ data: { key: KEY, content } })
        result.current = res.ok ? { ok: true } : { ok: false, error: res.error }
      } catch {
        result.current = { ok: false, error: 'Compatible devices could not be saved. Check your connection.' }
      }
    },
  })

  const values = useStore(form.store, (s) => s.values)
  const attempted = useStore(form.store, (s) => s.submissionAttempts > 0)
  const dirty = !same(values, initial)
  useReportDirty(dirty, onDirtyChange)

  useImperativeHandle(
    ref,
    () => ({
      save: async () => {
        if (!dirty) return null
        result.current = null
        await form.handleSubmit()
        // onSubmit does not run when validation fails, so no result means invalid fields.
        return result.current ?? { ok: false, error: 'Fix the highlighted fields in Compatible devices.' }
      },
    }),
    [dirty, form],
  )

  const textField = (name: 'eyebrow' | 'title' | 'description', label: string, hint?: string) => (
    <form.Field name={name}>
      {(field) => {
        const id = `devices-${name}`
        const error = attempted ? firstError(field.state.meta.errors) : undefined
        const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined
        const common = {
          id,
          value: field.state.value,
          onBlur: field.handleBlur,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': describedBy,
        }
        return (
          <div>
            <Label htmlFor={id}>{label}</Label>
            {name === 'description' ? (
              <textarea
                {...common}
                rows={2}
                onChange={(e) => field.handleChange(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-input bg-background p-3 text-sm text-foreground"
              />
            ) : (
              <Input {...common} onChange={(e) => field.handleChange(e.target.value)} className="mt-1.5 h-9 bg-background" />
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
      }}
    </form.Field>
  )

  const arrowButton = cn(buttonSecondary, 'size-7 p-0')

  return (
    // Enter in a field saves through the header button's handler, not a second path.
    <form noValidate onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="mb-2 text-sm font-semibold text-ink-200">Heading</legend>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          {textField('eyebrow', 'Small label', 'Leave empty to hide it.')}
          {textField('title', 'Heading')}
        </div>
        {textField('description', 'Intro text', 'Leave empty to hide it.')}
      </fieldset>

      <form.Field name="items" mode="array">
        {(itemsField) => {
          const items = itemsField.state.value
          const listError = attempted ? firstError(itemsField.state.meta.errors) : undefined
          return (
            <fieldset>
              <legend className="mb-2 flex w-full items-baseline justify-between text-sm font-semibold text-ink-200">
                Devices <span className="font-mono text-xs font-normal text-ink-500">{items.length} shown</span>
              </legend>
              <ol className="divide-y divide-ink-800 rounded-xl border border-ink-800">
                {items.map((item, i) => (
                  <li key={item.id} className="flex flex-wrap items-start gap-3 px-3 py-3 sm:flex-nowrap">
                    <button
                      type="button"
                      onClick={() => setPicking(i)}
                      aria-label={item.image ? `Change the image of ${item.name || `device ${i + 1}`}` : `Add an image to ${item.name || `device ${i + 1}`}`}
                      className="group relative size-16 shrink-0 overflow-hidden rounded-lg border border-ink-700 bg-ink-950 hover:border-ink-500"
                    >
                      {item.image ? (
                        <img
                          src={item.image.url}
                          alt=""
                          width={item.image.width}
                          height={item.image.height}
                          className="size-full object-contain"
                        />
                      ) : (
                        <ImagePlus aria-hidden="true" className="m-auto size-5 text-ink-500 group-hover:text-ink-300" />
                      )}
                    </button>

                    <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                      <form.Field name={`items[${i}].name`}>
                        {(field) => {
                          const id = `device-${item.id}-name`
                          const error = attempted ? firstError(field.state.meta.errors) : undefined
                          return (
                            <div>
                              <Label htmlFor={id} className="text-xs">
                                Name
                              </Label>
                              <Input
                                id={id}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                aria-invalid={error ? true : undefined}
                                aria-describedby={error ? `${id}-error` : undefined}
                                className="mt-1 h-9 bg-background"
                              />
                              {error && (
                                <p id={`${id}-error`} className="mt-1 text-xs text-destructive">
                                  {error}
                                </p>
                              )}
                            </div>
                          )
                        }}
                      </form.Field>
                      <form.Field name={`items[${i}].brand`}>
                        {(field) => {
                          const id = `device-${item.id}-brand`
                          const error = attempted ? firstError(field.state.meta.errors) : undefined
                          return (
                            <div>
                              <Label htmlFor={id} className="text-xs">
                                Small line under the name <span className="font-normal text-ink-500">(optional)</span>
                              </Label>
                              <Input
                                id={id}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                aria-invalid={error ? true : undefined}
                                aria-describedby={error ? `${id}-error` : undefined}
                                className="mt-1 h-9 bg-background"
                              />
                              {error && (
                                <p id={`${id}-error`} className="mt-1 text-xs text-destructive">
                                  {error}
                                </p>
                              )}
                            </div>
                          )
                        }}
                      </form.Field>
                      {item.image && (
                        <form.Field name={`items[${i}].image.alt`}>
                          {(field) => {
                            const id = `device-${item.id}-alt`
                            const error = attempted ? firstError(field.state.meta.errors) : undefined
                            return (
                              <div className="sm:col-span-2">
                                <Label htmlFor={id} className="text-xs">
                                  Image alt text
                                </Label>
                                <div className="mt-1 flex gap-2">
                                  <Input
                                    id={id}
                                    // The path runs through a nullable image, so the type is wider than the string it holds here.
                                    value={typeof field.state.value === 'string' ? field.state.value : ''}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    aria-invalid={error ? true : undefined}
                                    aria-describedby={error ? `${id}-error` : undefined}
                                    className="h-9 bg-background"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => form.setFieldValue(`items[${i}].image`, null)}
                                    className={cn(buttonSecondary, 'h-9 shrink-0')}
                                  >
                                    Remove image
                                  </button>
                                </div>
                                {error && (
                                  <p id={`${id}-error`} className="mt-1 text-xs text-destructive">
                                    {error}
                                  </p>
                                )}
                              </div>
                            )
                          }}
                        </form.Field>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-0.5 pt-5">
                      <button
                        type="button"
                        onClick={() => itemsField.moveValue(i, i - 1)}
                        disabled={i === 0}
                        aria-label={`Move ${item.name || `device ${i + 1}`} up`}
                        className={arrowButton}
                      >
                        <ArrowUp aria-hidden="true" className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => itemsField.moveValue(i, i + 1)}
                        disabled={i === items.length - 1}
                        aria-label={`Move ${item.name || `device ${i + 1}`} down`}
                        className={arrowButton}
                      >
                        <ArrowDown aria-hidden="true" className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => itemsField.removeValue(i)}
                        disabled={items.length === 1}
                        aria-label={`Remove ${item.name || `device ${i + 1}`}`}
                        className={cn(arrowButton, 'hover:text-destructive')}
                      >
                        <Trash2 aria-hidden="true" className="size-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
              {listError && <p className="mt-2 text-xs text-destructive">{listError}</p>}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={items.length >= MAX_ITEMS}
                  onClick={() =>
                    itemsField.pushValue({ id: `device-${Date.now().toString(36)}`, name: '', brand: '', image: null })
                  }
                  className={buttonSecondary}
                >
                  <Plus aria-hidden="true" className="size-4" />
                  Add device
                </button>
                {!same(values, DEFAULTS) && (
                  <button
                    type="button"
                    onClick={() => form.reset(DEFAULTS, { keepDefaultValues: true })}
                    className="text-sm font-medium text-signal-400 underline-offset-2 hover:underline"
                  >
                    Use the original content
                  </button>
                )}
              </div>

              <ImagePickerSheet
                open={picking !== null}
                onClose={() => setPicking(null)}
                assets={assets}
                currentId={picking === null ? null : items[picking]?.image?.assetId}
                description="Product photo on a transparent or plain background, about 800 × 800."
                onPick={(a) => {
                  if (picking === null) return
                  const keepAlt = items[picking]?.image?.assetId === a.id ? items[picking]?.image?.alt : undefined
                  form.setFieldValue(`items[${picking}].image`, {
                    assetId: a.id,
                    url: a.url,
                    width: a.width,
                    height: a.height,
                    alt: keepAlt ?? (items[picking]?.name || a.alt),
                  })
                }}
              />
            </fieldset>
          )
        }}
      </form.Field>
    </form>
  )
}
