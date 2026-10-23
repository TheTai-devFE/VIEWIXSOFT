import { revalidateLogic, useForm, useStore } from '@tanstack/react-form'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useImperativeHandle, useRef } from 'react'
import type { Ref } from 'react'
import { buttonSecondary, firstError } from '~/components/admin/admin-ui'
import type { EditorHandle, SaveResult } from '~/components/admin/admin-ui'
import { ContentField } from '~/components/admin/content/ContentField'
import { useReportDirty } from '~/hooks/use-save-all'
import { cn } from '~/lib/cn'
import { HowItWorksContentSchema, SECTION_CONTENT } from '~/lib/section-content'
import type { HowItWorksContent } from '~/lib/section-content'
import { saveSectionContentFn } from '~/server/functions/site-admin'

const KEY = 'home:how-it-works'
const DEFAULTS = SECTION_CONTENT[KEY].defaults
const MAX_STEPS = 4

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** The home page "How it works" section: its heading and the numbered steps. */
export function HowItWorksContentEditor({
  initial,
  ref,
  onDirtyChange,
}: {
  initial: HowItWorksContent
  ref?: Ref<EditorHandle>
  onDirtyChange?: (dirty: boolean) => void
}) {
  const result = useRef<SaveResult | null>(null)

  const form = useForm({
    defaultValues: initial,
    validationLogic: revalidateLogic({ mode: 'submit', modeAfterSubmission: 'change' }),
    validators: { onDynamic: HowItWorksContentSchema },
    onSubmit: async ({ value }) => {
      try {
        // Content equal to the defaults is stored as "no override", so later code changes still show.
        const content = same(value, DEFAULTS) ? null : value
        const res = await saveSectionContentFn({ data: { key: KEY, content } })
        result.current = res.ok ? { ok: true } : { ok: false, error: res.error }
      } catch {
        result.current = { ok: false, error: 'How it works could not be saved. Check your connection.' }
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
        return result.current ?? { ok: false, error: 'Fix the highlighted fields in How it works.' }
      },
    }),
    [dirty, form],
  )

  const arrowButton = cn(buttonSecondary, 'size-7 p-0')

  return (
    // Enter in a field saves through the header button's handler, not a second path.
    <form noValidate onSubmit={(e) => e.preventDefault()} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <form.Field name="eyebrow">
          {(field) => (
            <ContentField
              id="hiw-eyebrow"
              label="Label"
              hint="Leave empty to hide it."
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              error={attempted ? firstError(field.state.meta.errors) : undefined}
            />
          )}
        </form.Field>
        <form.Field name="title">
          {(field) => (
            <ContentField
              id="hiw-title"
              label="Heading"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              error={attempted ? firstError(field.state.meta.errors) : undefined}
            />
          )}
        </form.Field>
      </div>

      <form.Field name="description">
        {(field) => (
          <ContentField
            id="hiw-description"
            label="Intro"
            hint="Leave empty to hide it."
            rows={3}
            value={field.state.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            error={attempted ? firstError(field.state.meta.errors) : undefined}
          />
        )}
      </form.Field>

      <form.Field name="steps" mode="array">
        {(listField) => {
          const steps = listField.state.value
          const listError = attempted ? firstError(listField.state.meta.errors) : undefined
          return (
            <fieldset>
              <legend className="mb-2 flex w-full items-baseline justify-between text-sm font-semibold text-ink-200">
                Steps <span className="font-mono text-xs font-normal text-ink-500">{steps.length} of {MAX_STEPS}</span>
              </legend>

              <ol className="space-y-3">
                {steps.map((step, i) => {
                  const label = `step ${i + 1}`
                  return (
                    <li key={step.id} className="rounded-xl border border-ink-800 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-ink-500">0{i + 1}</span>
                        <div className="flex shrink-0 gap-0.5">
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
                      </div>

                      <form.Field name={`steps[${i}].title`}>
                        {(field) => (
                          <ContentField
                            id={`hiw-${step.id}-title`}
                            label="Step title"
                            className="mt-2"
                            value={field.state.value}
                            onChange={field.handleChange}
                            onBlur={field.handleBlur}
                            error={attempted ? firstError(field.state.meta.errors) : undefined}
                          />
                        )}
                      </form.Field>
                      <form.Field name={`steps[${i}].description`}>
                        {(field) => (
                          <ContentField
                            id={`hiw-${step.id}-description`}
                            label="Step text"
                            className="mt-3"
                            rows={2}
                            value={field.state.value}
                            onChange={field.handleChange}
                            onBlur={field.handleBlur}
                            error={attempted ? firstError(field.state.meta.errors) : undefined}
                          />
                        )}
                      </form.Field>
                    </li>
                  )
                })}
              </ol>
              {listError && <p className="mt-2 text-xs text-destructive">{listError}</p>}

              <button
                type="button"
                disabled={steps.length >= MAX_STEPS}
                onClick={() => listField.pushValue({ id: `step-${Date.now().toString(36)}`, title: '', description: '' })}
                className={cn(buttonSecondary, 'mt-3')}
              >
                <Plus aria-hidden="true" className="size-4" />
                Add step
              </button>
            </fieldset>
          )
        }}
      </form.Field>
    </form>
  )
}
