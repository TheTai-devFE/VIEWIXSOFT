import { revalidateLogic, useForm, useStore } from '@tanstack/react-form'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useImperativeHandle, useRef } from 'react'
import type { Ref } from 'react'
import { buttonSecondary, firstError } from '~/components/admin/admin-ui'
import type { EditorHandle, SaveResult } from '~/components/admin/admin-ui'
import { ContentField } from '~/components/admin/content/ContentField'
import { useReportDirty } from '~/hooks/use-save-all'
import { cn } from '~/lib/cn'
import { ContactSectionContentSchema, SECTION_CONTENT } from '~/lib/section-content'
import type { ContactSectionContent } from '~/lib/section-content'
import { saveSectionContentFn } from '~/server/functions/site-admin'

const KEY = 'home:demo-form'
const DEFAULTS = SECTION_CONTENT[KEY].defaults
const MAX_STEPS = 5

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** The text around the demo form on /contact, and the home page contact band. The form fields are fixed. */
export function ContactSectionEditor({
  initial,
  ref,
  onDirtyChange,
}: {
  initial: ContactSectionContent
  ref?: Ref<EditorHandle>
  onDirtyChange?: (dirty: boolean) => void
}) {
  const result = useRef<SaveResult | null>(null)

  const form = useForm({
    defaultValues: initial,
    validationLogic: revalidateLogic({ mode: 'submit', modeAfterSubmission: 'change' }),
    validators: { onDynamic: ContactSectionContentSchema },
    onSubmit: async ({ value }) => {
      try {
        // Content equal to the defaults is stored as "no override", so later code changes still show.
        const content = same(value, DEFAULTS) ? null : value
        const res = await saveSectionContentFn({ data: { key: KEY, content } })
        result.current = res.ok ? { ok: true } : { ok: false, error: res.error }
      } catch {
        result.current = { ok: false, error: 'Contact could not be saved. Check your connection.' }
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
        return result.current ?? { ok: false, error: 'Fix the highlighted fields in Contact.' }
      },
    }),
    [dirty, form],
  )

  const errorOf = (errors: unknown[]) => (attempted ? firstError(errors) : undefined)
  const arrowButton = cn(buttonSecondary, 'size-7 p-0')

  return (
    // Enter in a field saves through the header button's handler, not a second path.
    <form noValidate onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <p className="rounded-lg bg-ink-950 px-3 py-2 text-xs text-ink-400">
        The steps show beside the demo form on the Contact page; the band below is the home page Contact section. The form fields themselves can't be changed here.
      </p>

      <form.Field name="steps" mode="array">
        {(listField) => {
          const steps = listField.state.value
          const listError = errorOf(listField.state.meta.errors)
          return (
            <fieldset>
              <legend className="mb-1 flex w-full items-baseline justify-between text-sm font-semibold text-ink-200">
                What happens next <span className="font-mono text-xs font-normal text-ink-500">{steps.length} of {MAX_STEPS}</span>
              </legend>
              <p className="mb-2 text-xs text-muted-foreground">Listed beside the form on the Contact page.</p>

              <ol className="divide-y divide-ink-800 rounded-xl border border-ink-800">
                {steps.map((step, i) => {
                  const label = `step ${i + 1}`
                  return (
                    <li key={step.id} className="flex items-start gap-3 px-3 py-2.5">
                      <span className="mt-2 font-mono text-xs text-ink-500">0{i + 1}</span>
                      <form.Field name={`steps[${i}].text`}>
                        {(field) => (
                          <ContentField
                            id={`contact-${step.id}`}
                            label={`Step ${i + 1}`}
                            srOnlyLabel
                            className="min-w-0 flex-1"
                            value={field.state.value}
                            onChange={field.handleChange}
                            onBlur={field.handleBlur}
                            error={errorOf(field.state.meta.errors)}
                          />
                        )}
                      </form.Field>
                      <div className="mt-1 flex shrink-0 gap-0.5">
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
                          disabled={i === steps.length - 1}
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
              {listError && <p className="mt-2 text-xs text-destructive">{listError}</p>}

              <button
                type="button"
                disabled={steps.length >= MAX_STEPS}
                onClick={() => listField.pushValue({ id: `step-${Date.now().toString(36)}`, text: '' })}
                className={cn(buttonSecondary, 'mt-3')}
              >
                <Plus aria-hidden="true" className="size-4" />
                Add step
              </button>
            </fieldset>
          )
        }}
      </form.Field>

      <fieldset className="rounded-xl border border-ink-800 p-4">
        <legend className="px-1 text-sm font-semibold text-ink-200">Home contact band</legend>

        <form.Field name="partner.show">
          {(field) => (
            <label className="flex items-center gap-2.5 text-sm text-ink-200">
              <input
                type="checkbox"
                checked={field.state.value}
                onChange={(e) => field.handleChange(e.target.checked)}
                className="size-4 accent-signal-500"
              />
              Show the contact band on the home page
            </label>
          )}
        </form.Field>

        {values.partner.show && (
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <form.Field name="partner.eyebrow">
                {(field) => (
                  <ContentField
                    id="partner-eyebrow"
                    label="Label"
                    hint="Leave empty to hide it."
                    value={field.state.value}
                    onChange={field.handleChange}
                    onBlur={field.handleBlur}
                    error={errorOf(field.state.meta.errors)}
                  />
                )}
              </form.Field>
              <form.Field name="partner.title">
                {(field) => (
                  <ContentField
                    id="partner-title"
                    label="Heading"
                    value={field.state.value}
                    onChange={field.handleChange}
                    onBlur={field.handleBlur}
                    error={errorOf(field.state.meta.errors)}
                  />
                )}
              </form.Field>
            </div>
            <form.Field name="partner.description">
              {(field) => (
                <ContentField
                  id="partner-description"
                  label="Text"
                  hint="Leave empty to hide it."
                  rows={2}
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  error={errorOf(field.state.meta.errors)}
                />
              )}
            </form.Field>
            <form.Field name="partner.cta">
              {(field) => (
                <ContentField
                  id="partner-cta"
                  label="Button text"
                  hint="Opens the Contact page. The second button, Get started, opens the Viewixsoft CMS page."
                  className="max-w-xs"
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  error={errorOf(field.state.meta.errors)}
                />
              )}
            </form.Field>
          </div>
        )}
      </fieldset>
    </form>
  )
}
