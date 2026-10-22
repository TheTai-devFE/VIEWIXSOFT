import { useRouter } from '@tanstack/react-router'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { buttonPrimary, buttonSecondary, firstError, Panel, SaveStatus } from '~/components/admin/admin-ui'
import type { SaveState } from '~/components/admin/admin-ui'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { TestimonialSchema } from '~/lib/admin-schemas'
import type { TestimonialInput } from '~/lib/admin-schemas'
import { deleteTestimonialFn, saveTestimonialFn } from '~/server/functions/site-admin'

export interface SavedTestimonial {
  id: string
  name: string
  role: string
  company: string
  quote: string
  uses: string[]
  avatarUrl: string | null
  rating: number | null
  approved: boolean
  consentDate: string
  sortOrder: number
}

type FormValues = TestimonialInput

const EMPTY: FormValues = {
  name: '',
  role: '',
  company: '',
  quote: '',
  uses: 'Viewixsoft CMS',
  avatarUrl: '',
  rating: '',
  consentDate: '',
  approved: false,
  sortOrder: '0',
}

function toForm(t: SavedTestimonial): FormValues {
  return {
    id: t.id,
    name: t.name,
    role: t.role,
    company: t.company,
    quote: t.quote,
    uses: t.uses.join(', '),
    avatarUrl: t.avatarUrl ?? '',
    rating: t.rating ? String(t.rating) : '',
    consentDate: t.consentDate,
    approved: t.approved,
    sortOrder: String(t.sortOrder),
  }
}

/** Customer quotes for the About page. Only approved quotes with a consent date are shown. */
export function TestimonialsEditor({ saved }: { saved: SavedTestimonial[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<FormValues>(EMPTY)
  const [formKey, setFormKey] = useState(0)

  const edit = (values: FormValues) => {
    setEditing(values)
    setFormKey((k) => k + 1)
  }

  return (
    <Panel
      title="Customer quotes"
      description="Add a quote only with the customer's written approval of the wording, name, company and photo."
    >
      {saved.length > 0 && (
        <ul className="mb-6 divide-y divide-ink-800 rounded-xl border border-ink-800">
          {saved.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="min-w-0">
                <span className="font-medium text-ink-50">{t.name}</span>{' '}
                <span className="text-ink-400">
                  · {t.company} · {t.approved ? 'Shown' : 'Hidden (not approved)'}
                </span>
              </span>
              <span className="flex gap-2">
                <button type="button" className={buttonSecondary} onClick={() => edit(toForm(t))}>
                  Edit
                </button>
                <button
                  type="button"
                  className={buttonSecondary}
                  onClick={async () => {
                    if (!window.confirm(`Delete the quote from ${t.name}?`)) return
                    await deleteTestimonialFn({ data: { id: t.id } })
                    await router.invalidate()
                  }}
                >
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <TestimonialForm
        key={formKey}
        initial={editing}
        onDone={async () => {
          edit(EMPTY)
          await router.invalidate()
        }}
      />
    </Panel>
  )
}

function TestimonialForm({ initial, onDone }: { initial: FormValues; onDone: () => Promise<void> }) {
  const [state, setState] = useState<SaveState>({ kind: 'idle' })
  const form = useForm({
    defaultValues: initial,
    validationLogic: revalidateLogic({ mode: 'submit', modeAfterSubmission: 'change' }),
    validators: { onDynamic: TestimonialSchema },
    onSubmit: async ({ value }) => {
      setState({ kind: 'saving' })
      try {
        const res = await saveTestimonialFn({ data: value })
        if (!res.ok) return setState({ kind: 'error', message: res.error })
        setState({ kind: 'saved' })
        await onDone()
      } catch {
        setState({ kind: 'error', message: 'Saving failed. Check every field and try again.' })
      }
    },
  })

  const text = [
    { name: 'name', label: 'Name', type: 'text' },
    { name: 'role', label: 'Role', type: 'text' },
    { name: 'company', label: 'Company', type: 'text' },
    { name: 'uses', label: 'Uses (comma-separated)', type: 'text' },
    { name: 'avatarUrl', label: 'Photo URL (optional)', type: 'url' },
    { name: 'rating', label: 'Rating 1–5 (optional)', type: 'number' },
    { name: 'consentDate', label: 'Written consent date', type: 'date' },
    { name: 'sortOrder', label: 'Order', type: 'number' },
  ] as const

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
      className="space-y-4 rounded-xl border border-ink-800 bg-ink-950 p-4"
    >
      <h3 className="text-sm font-semibold text-ink-50">{initial.id ? 'Edit quote' : 'Add a quote'}</h3>
      <form.Field name="quote">
        {(field) => {
          const error = form.state.submissionAttempts > 0 ? firstError(field.state.meta.errors) : undefined
          return (
            <div>
              <Label htmlFor="testimonial-quote">Quote</Label>
              <textarea
                id="testimonial-quote"
                rows={3}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'testimonial-quote-error' : undefined}
                className="mt-1.5 w-full rounded-md border border-ink-700 bg-ink-900 p-3 text-sm text-ink-50"
              />
              {error && (
                <p id="testimonial-quote-error" className="mt-1 text-xs text-destructive">
                  {error}
                </p>
              )}
            </div>
          )
        }}
      </form.Field>
      <div className="grid gap-4 sm:grid-cols-2">
        {text.map((f) => (
          <form.Field key={f.name} name={f.name}>
            {(field) => {
              const error = form.state.submissionAttempts > 0 ? firstError(field.state.meta.errors) : undefined
              return (
                <div>
                  <Label htmlFor={`testimonial-${f.name}`}>{f.label}</Label>
                  <Input
                    id={`testimonial-${f.name}`}
                    type={f.type}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `testimonial-${f.name}-error` : undefined}
                    className="mt-1.5 h-10 bg-ink-900 text-ink-50"
                  />
                  {error && (
                    <p id={`testimonial-${f.name}-error`} className="mt-1 text-xs text-destructive">
                      {error}
                    </p>
                  )}
                </div>
              )
            }}
          </form.Field>
        ))}
      </div>
      <form.Field name="approved">
        {(field) => (
          <div className="flex items-center gap-2">
            <input
              id="testimonial-approved"
              type="checkbox"
              checked={field.state.value}
              onChange={(e) => field.handleChange(e.target.checked)}
              className="size-4 accent-signal-500"
            />
            <label htmlFor="testimonial-approved" className="text-sm text-ink-200">
              Approved: show this quote on the site
            </label>
          </div>
        )}
      </form.Field>
      <div className="flex flex-wrap items-center gap-3">
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <button type="submit" disabled={isSubmitting} className={buttonPrimary}>
              {initial.id ? 'Save changes' : 'Add quote'}
            </button>
          )}
        </form.Subscribe>
        <SaveStatus state={state} />
      </div>
    </form>
  )
}
