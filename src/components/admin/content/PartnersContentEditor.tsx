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
import { cn } from '~/lib/cn'
import { HomeHeroContentSchema, SECTION_CONTENT } from '~/lib/section-content'
import type { HomeHeroContent } from '~/lib/section-content'
import { saveSectionContentFn } from '~/server/functions/site-admin'

const KEY = 'home:hero'
const DEFAULTS = SECTION_CONTENT[KEY].defaults
const MAX_PARTNERS = 20

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** The partner logo strip under the home page hero: its label and the partners, in order. */
export function PartnersContentEditor({
  initial,
  assets,
  ref,
  onDirtyChange,
}: {
  initial: HomeHeroContent
  assets: LibraryAsset[]
  ref?: Ref<EditorHandle>
  onDirtyChange?: (dirty: boolean) => void
}) {
  const result = useRef<SaveResult | null>(null)
  const [picking, setPicking] = useState<number | null>(null)

  const form = useForm({
    defaultValues: initial,
    validationLogic: revalidateLogic({ mode: 'submit', modeAfterSubmission: 'change' }),
    validators: { onDynamic: HomeHeroContentSchema },
    onSubmit: async ({ value }) => {
      try {
        // Content equal to the defaults is stored as "no override", so later code changes still show.
        const content = same(value, DEFAULTS) ? null : value
        const res = await saveSectionContentFn({ data: { key: KEY, content } })
        result.current = res.ok ? { ok: true } : { ok: false, error: res.error }
      } catch {
        result.current = { ok: false, error: 'Partner logos could not be saved. Check your connection.' }
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
        return result.current ?? { ok: false, error: 'Fix the highlighted fields in Partner logos.' }
      },
    }),
    [dirty, form],
  )

  const arrowButton = cn(buttonSecondary, 'size-7 p-0')

  return (
    // Enter in a field saves through the header button's handler, not a second path.
    <form noValidate onSubmit={(e) => e.preventDefault()} className="space-y-5">
      <p className="rounded-lg bg-ink-950 px-3 py-2 text-xs text-ink-400">
        The strip under the heading. Add a partner only with their written permission to show the logo. With no
        partners the strip is hidden.
      </p>

      <form.Field name="partnersLabel">
        {(field) => {
          const id = 'partners-label'
          const error = attempted ? firstError(field.state.meta.errors) : undefined
          return (
            <div className="max-w-md">
              <Label htmlFor={id}>Label above the logos</Label>
              <Input
                id={id}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={[error && `${id}-error`, `${id}-hint`].filter(Boolean).join(' ')}
                className="mt-1.5 h-9 bg-background"
              />
              <p id={`${id}-hint`} className="mt-1 text-xs text-muted-foreground">
                Leave empty to hide it.
              </p>
              {error && (
                <p id={`${id}-error`} className="mt-1 text-xs text-destructive">
                  {error}
                </p>
              )}
            </div>
          )
        }}
      </form.Field>

      <form.Field name="partners" mode="array">
        {(listField) => {
          const partners = listField.state.value
          const listError = attempted ? firstError(listField.state.meta.errors) : undefined
          return (
            <fieldset>
              <legend className="mb-2 flex w-full items-baseline justify-between text-sm font-semibold text-ink-200">
                Partners <span className="font-mono text-xs font-normal text-ink-500">{partners.length} shown</span>
              </legend>

              {partners.length === 0 ? (
                <p className="rounded-xl border border-dashed border-ink-700 p-6 text-center text-sm text-ink-400">
                  No partners yet, so the strip is hidden on the site.
                </p>
              ) : (
                <ol className="divide-y divide-ink-800 rounded-xl border border-ink-800">
                  {partners.map((partner, i) => {
                    const label = partner.name || `partner ${i + 1}`
                    return (
                      <li key={partner.id} className="flex items-center gap-3 px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => setPicking(i)}
                          aria-label={partner.logo ? `Change the logo of ${label}` : `Add a logo to ${label}`}
                          className="group flex h-12 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink-700 bg-ink-950 p-1.5 hover:border-ink-500"
                        >
                          {partner.logo ? (
                            <img
                              src={partner.logo.url}
                              alt=""
                              width={partner.logo.width}
                              height={partner.logo.height}
                              className="max-h-full w-auto object-contain"
                            />
                          ) : (
                            <ImagePlus aria-hidden="true" className="size-5 text-ink-500 group-hover:text-ink-300" />
                          )}
                        </button>

                        <form.Field name={`partners[${i}].name`}>
                          {(field) => {
                            const id = `partner-${partner.id}-name`
                            const error = attempted ? firstError(field.state.meta.errors) : undefined
                            return (
                              <div className="min-w-0 flex-1">
                                <Label htmlFor={id} className="sr-only">
                                  Partner name
                                </Label>
                                <Input
                                  id={id}
                                  value={field.state.value}
                                  placeholder="Partner name"
                                  onBlur={field.handleBlur}
                                  onChange={(e) => field.handleChange(e.target.value)}
                                  aria-invalid={error ? true : undefined}
                                  aria-describedby={error ? `${id}-error` : undefined}
                                  className="h-9 bg-background"
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

                        <div className="flex shrink-0 gap-0.5">
                          {partner.logo && (
                            <button
                              type="button"
                              onClick={() => form.setFieldValue(`partners[${i}].logo`, null)}
                              className={cn(buttonSecondary, 'h-7 px-2 text-xs')}
                            >
                              Remove logo
                              <span className="sr-only"> of {label}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => listField.moveValue(i, i - 1)}
                            disabled={i === 0}
                            aria-label={`Move ${label} up`}
                            className={arrowButton}
                          >
                            <ArrowUp aria-hidden="true" className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => listField.moveValue(i, i + 1)}
                            disabled={i === partners.length - 1}
                            aria-label={`Move ${label} down`}
                            className={arrowButton}
                          >
                            <ArrowDown aria-hidden="true" className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => listField.removeValue(i)}
                            aria-label={`Remove ${label}`}
                            className={cn(arrowButton, 'hover:text-destructive')}
                          >
                            <Trash2 aria-hidden="true" className="size-3.5" />
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
              {listError && <p className="mt-2 text-xs text-destructive">{listError}</p>}

              <button
                type="button"
                disabled={partners.length >= MAX_PARTNERS}
                onClick={() => listField.pushValue({ id: `partner-${Date.now().toString(36)}`, name: '', logo: null })}
                className={cn(buttonSecondary, 'mt-3')}
              >
                <Plus aria-hidden="true" className="size-4" />
                Add partner
              </button>

              <ImagePickerSheet
                open={picking !== null}
                onClose={() => setPicking(null)}
                assets={assets}
                currentId={picking === null ? null : partners[picking]?.logo?.assetId}
                description="Partner logo, PNG or WebP with a transparent background, at least 200 px wide."
                onPick={(a) => {
                  if (picking === null) return
                  form.setFieldValue(`partners[${picking}].logo`, { assetId: a.id, url: a.url, width: a.width, height: a.height })
                }}
              />
            </fieldset>
          )
        }}
      </form.Field>
    </form>
  )
}
