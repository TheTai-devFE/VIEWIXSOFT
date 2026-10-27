import { revalidateLogic, useForm, useStore } from '@tanstack/react-form'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useImperativeHandle, useRef } from 'react'
import type { Ref } from 'react'
import { buttonSecondary, firstError } from '~/components/admin/admin-ui'
import type { EditorHandle, SaveResult } from '~/components/admin/admin-ui'
import { useReportDirty } from '~/hooks/use-save-all'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { cn } from '~/lib/cn'
import { FaqContentSchema, SECTION_CONTENT } from '~/lib/section-content'
import type { FaqContent } from '~/lib/section-content'
import { saveSectionContentFn } from '~/server/functions/site-admin'

const MAX_QUESTIONS = 12

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

const textareaClass = 'mt-1.5 w-full rounded-md border border-input bg-background p-3 text-sm text-foreground'

/** An FAQ section (home page or Viewixsoft CMS page): its heading and the questions, in order. */
export function FaqContentEditor({
  contentKey = 'home:faq',
  initial,
  ref,
  onDirtyChange,
}: {
  contentKey?: 'home:faq' | 'product-cms:faq' | 'about:faq'
  initial: FaqContent
  ref?: Ref<EditorHandle>
  onDirtyChange?: (dirty: boolean) => void
}) {
  const result = useRef<SaveResult | null>(null)

  const form = useForm({
    defaultValues: initial,
    validationLogic: revalidateLogic({ mode: 'submit', modeAfterSubmission: 'change' }),
    validators: { onDynamic: FaqContentSchema },
    onSubmit: async ({ value }) => {
      try {
        // Content equal to the defaults is stored as "no override", so later code changes still show.
        const content = same(value, SECTION_CONTENT[contentKey].defaults) ? null : value
        const res = await saveSectionContentFn({ data: { key: contentKey, content } })
        result.current = res.ok ? { ok: true } : { ok: false, error: res.error }
      } catch {
        result.current = { ok: false, error: 'The FAQ could not be saved. Check your connection.' }
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
        return result.current ?? { ok: false, error: 'Fix the highlighted fields in FAQ.' }
      },
    }),
    [dirty, form],
  )

  const headingField = (name: 'eyebrow' | 'title', label: string, hint?: string) => (
    <form.Field name={name}>
      {(field) => {
        const id = `faq-${name}`
        const error = attempted ? firstError(field.state.meta.errors) : undefined
        const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined
        return (
          <div>
            <Label htmlFor={id}>{label}</Label>
            <Input
              id={id}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              className="mt-1.5 h-9 bg-background"
            />
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
    <form noValidate onSubmit={(e) => e.preventDefault()} className="space-y-5">
      <p className="rounded-lg bg-ink-950 px-3 py-2 text-xs text-ink-400">
        These questions also go to Google (FAQ rich results) and AI assistants. Start each answer with a direct reply
        that makes sense on its own, and only state facts that are true today.
      </p>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        {headingField('eyebrow', 'Label', 'Leave empty to hide it.')}
        {headingField('title', 'Heading')}
      </div>

      <form.Field name="items" mode="array">
        {(listField) => {
          const items = listField.state.value
          const listError = attempted ? firstError(listField.state.meta.errors) : undefined
          return (
            <fieldset>
              <legend className="mb-2 flex w-full items-baseline justify-between text-sm font-semibold text-ink-200">
                Questions <span className="font-mono text-xs font-normal text-ink-500">{items.length} shown</span>
              </legend>

              <ol className="space-y-3">
                {items.map((item, i) => {
                  const label = `question ${i + 1}`
                  return (
                    <li key={item.id} className="rounded-xl border border-ink-800 p-3">
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
                            disabled={i === items.length - 1}
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

                      <form.Field name={`items[${i}].question`}>
                        {(field) => {
                          const id = `faq-${item.id}-question`
                          const error = attempted ? firstError(field.state.meta.errors) : undefined
                          return (
                            <div className="mt-2">
                              <Label htmlFor={id}>Question</Label>
                              <Input
                                id={id}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                aria-invalid={error ? true : undefined}
                                aria-describedby={error ? `${id}-error` : undefined}
                                className="mt-1.5 h-9 bg-background"
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

                      <form.Field name={`items[${i}].answer`}>
                        {(field) => {
                          const id = `faq-${item.id}-answer`
                          const error = attempted ? firstError(field.state.meta.errors) : undefined
                          return (
                            <div className="mt-3">
                              <Label htmlFor={id}>Answer</Label>
                              <textarea
                                id={id}
                                rows={3}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                aria-invalid={error ? true : undefined}
                                aria-describedby={error ? `${id}-error` : undefined}
                                className={textareaClass}
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
                    </li>
                  )
                })}
              </ol>
              {listError && <p className="mt-2 text-xs text-destructive">{listError}</p>}

              <button
                type="button"
                disabled={items.length >= MAX_QUESTIONS}
                onClick={() => listField.pushValue({ id: `faq-${Date.now().toString(36)}`, question: '', answer: '' })}
                className={cn(buttonSecondary, 'mt-3')}
              >
                <Plus aria-hidden="true" className="size-4" />
                Add question
              </button>
            </fieldset>
          )
        }}
      </form.Field>
    </form>
  )
}
