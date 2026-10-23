import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import type { z } from 'zod'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { SCREEN_RANGES } from '~/components/story/story-content'
import { COUNTRIES } from '~/data/countries'
import { cn } from '~/lib/cn'
import { ContactLeadSchema } from '~/server/schema/validation'
import { submitLeadFn } from '~/server/functions/leads'
import { Turnstile } from '~/components/ui/turnstile'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

// One schema for both variants: the extra /contact fields are optional, so the
// quick form simply leaves them empty.
const LeadFormSchema = ContactLeadSchema.pick({
  name: true,
  email: true,
  company: true,
  jobTitle: true,
  country: true,
  phone: true,
  companySize: true,
  screenCount: true,
  message: true,
  honeypot: true,
})

type LeadFormValues = z.input<typeof LeadFormSchema>

const EMPTY_LEAD: LeadFormValues = {
  name: '',
  email: '',
  company: '',
  jobTitle: '',
  country: '',
  phone: '',
  companySize: '',
  screenCount: '',
  message: '',
  honeypot: '',
}

const COMPANY_SIZES = ['1 – 50 employees', '51 – 200 employees', '201 – 1,000 employees', '1,000+ employees']

const fieldClass = 'h-10 bg-ink-900 text-ink-50'
// Long lists (countries) scroll inside the panel instead of running off the page.
const selectPanelClass = 'max-h-64 overflow-y-auto'

/**
 * First error message for a field, shown once the visitor has left the field or
 * tried to submit, so nobody sees errors for fields they haven't reached yet.
 * Standard Schema errors are issue objects; plain strings are possible too.
 */
function shownError(meta: { errors: unknown[]; isBlurred: boolean }, submissionAttempts: number): string | undefined {
  if (!meta.isBlurred && submissionAttempts === 0) return undefined
  for (const e of meta.errors) {
    if (typeof e === 'string') return e
    if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') return e.message
  }
  return undefined
}

function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (!message) return null
  return (
    <p id={id} className="mt-1.5 text-xs text-destructive">
      {message}
    </p>
  )
}

function Optional() {
  return <span className="font-normal text-ink-400">(optional)</span>
}

function utmFromLocation() {
  const params = new URLSearchParams(window.location.search)
  return {
    utmSource: params.get('utm_source') ?? undefined,
    utmMedium: params.get('utm_medium') ?? undefined,
    utmCampaign: params.get('utm_campaign') ?? undefined,
    utmTerm: params.get('utm_term') ?? undefined,
    utmContent: params.get('utm_content') ?? undefined,
    referrer: document.referrer || undefined,
    landingPage: window.location.pathname,
  }
}

interface LeadFormProps {
  /** `quick` is the home page demo form; `full` adds job title, phone and company size for /contact. */
  variant: 'quick' | 'full'
  /** Keeps field ids unique if both variants ever share a page. */
  idPrefix: string
  initialValues?: Partial<LeadFormValues>
}

export function LeadForm({ variant, idPrefix, initialValues }: LeadFormProps) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>()
  const [turnstileReset, setTurnstileReset] = useState(0)
  const isFull = variant === 'full'
  const id = (name: string) => `${idPrefix}-${name}`

  const form = useForm({
    defaultValues: { ...EMPTY_LEAD, ...initialValues },
    // Check on blur at first; after a submit attempt, re-check on every change so
    // fixed fields clear right away instead of on the next blur.
    validationLogic: revalidateLogic({ mode: 'blur', modeAfterSubmission: 'change' }),
    validators: { onDynamic: LeadFormSchema },
    onSubmit: async ({ value }) => {
      setStatus('idle')
      try {
        const res = await submitLeadFn({
          // Submitting is the consent: the notice above the button says so.
          data: { ...value, consent: true, type: isFull ? 'contact' : 'demo', turnstileToken, ...utmFromLocation() },
        })
        if (res.ok) {
          setSentTo(value.email)
          setStatus('success')
          return
        }
        setErrorMessage(res.message)
      } catch {
        setErrorMessage("We couldn't send your request. Check your connection and try again.")
      }
      // A Turnstile token is single-use, so get a fresh one before the next try.
      setTurnstileReset((n) => n + 1)
      setStatus('error')
    },
  })

  if (status === 'success') {
    return (
      <div role="status" className="rounded-3xl border border-ink-800 bg-ink-900 p-8 sm:p-10">
        <CheckCircle2 aria-hidden="true" className="size-8 text-signal-400" />
        <h3 className="mt-5 font-display text-2xl font-semibold text-ink-50">Thanks, we got your request</h3>
        <p className="mt-3 text-ink-400">
          The Viewixsoft team will reply to <strong className="text-ink-200">{sentTo}</strong>
          {isFull ? '.' : ' to book your demo.'}
        </p>
        <button
          type="button"
          onClick={() => {
            form.reset()
            setStatus('idle')
          }}
          className="mt-6 text-sm font-semibold text-signal-400 hover:text-signal-300"
        >
          Send another request
        </button>
      </div>
    )
  }

  /** Plain text input with label, inline error and aria wiring. */
  const textField = (
    name: 'name' | 'email' | 'company' | 'jobTitle' | 'phone',
    label: string,
    opts: { type?: string; autoComplete: string; optional?: boolean },
  ) => (
    <form.Field name={name}>
      {(field) => {
        const error = shownError(field.state.meta, form.state.submissionAttempts)
        return (
          <div>
            <Label htmlFor={id(name)}>
              {label} {opts.optional && <Optional />}
            </Label>
            <Input
              id={id(name)}
              name={name}
              type={opts.type ?? 'text'}
              autoComplete={opts.autoComplete}
              required={!opts.optional}
              value={field.state.value ?? ''}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? id(`${name}-error`) : undefined}
              className={cn('mt-2', fieldClass)}
            />
            <FieldError id={id(`${name}-error`)} message={error} />
          </div>
        )
      }}
    </form.Field>
  )

  /** Optional select; these never fail validation, so no error wiring. */
  const optionalSelect = (name: 'screenCount' | 'companySize', label: string, placeholder: string, options: readonly string[]) => (
    <form.Field name={name}>
      {(field) => (
        <div>
          <Label htmlFor={id(name)}>
            {label} <Optional />
          </Label>
          <Select id={id(name)} value={field.state.value ?? ''} onValueChange={field.handleChange} className="mt-2">
            <SelectTrigger className={fieldClass}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className={selectPanelClass}>
              {options.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </form.Field>
  )

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
      className="rounded-3xl border border-ink-800 bg-ink-900 p-5 sm:p-8"
    >
      {/* Honeypot: hidden from people, filled by bots, rejected on the server. */}
      <form.Field name="honeypot">
        {(field) => (
          <div className="hidden" aria-hidden="true">
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>

      {status === 'error' && (
        <p role="alert" className="mb-6 rounded-xl border border-destructive/40 p-4 text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {textField('name', 'Full name', { autoComplete: 'name' })}
        {textField('email', 'Work email', { type: 'email', autoComplete: 'email' })}
        {textField('company', 'Company', { autoComplete: 'organization' })}
        {isFull && textField('jobTitle', 'Job title', { autoComplete: 'organization-title', optional: true })}

        <form.Field name="country">
          {(field) => {
            const error = shownError(field.state.meta, form.state.submissionAttempts)
            return (
              <div>
                <Label htmlFor={id('country')}>Country</Label>
                <Select id={id('country')} value={field.state.value} onValueChange={field.handleChange} className="mt-2">
                  <SelectTrigger
                    onBlur={field.handleBlur}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? id('country-error') : undefined}
                    className={fieldClass}
                  >
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent className={selectPanelClass}>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError id={id('country-error')} message={error} />
              </div>
            )
          }}
        </form.Field>

        {isFull && textField('phone', 'Phone', { type: 'tel', autoComplete: 'tel', optional: true })}
        {isFull && optionalSelect('companySize', 'Company size', 'Select a size', COMPANY_SIZES)}
        {/* The quick form has no companion field, so its screen range spans the row. */}
        <div className={cn(!isFull && 'sm:col-span-2')}>
          {optionalSelect('screenCount', 'Number of screens', 'Select a range', SCREEN_RANGES)}
        </div>
      </div>

      <form.Field name="message">
        {(field) => {
          const error = shownError(field.state.meta, form.state.submissionAttempts)
          return (
            <div className="mt-4">
              <Label htmlFor={id('message')}>
                {isFull ? 'Tell us about your screens and what you need' : 'What do you want to run on your screens?'}
              </Label>
              <textarea
                id={id('message')}
                name="message"
                rows={isFull ? 4 : 3}
                required
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? id('message-error') : undefined}
                className="mt-2 w-full rounded-md border border-input bg-ink-900 px-3 py-2 text-sm text-ink-50 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
              />
              <FieldError id={id('message-error')} message={error} />
            </div>
          )
        }}
      </form.Field>

      <p className="mt-4 text-sm text-ink-400">
        By submitting, you agree to the{' '}
        <Link to="/legal/privacy" className="text-signal-400 underline hover:text-signal-300">
          Privacy Policy
        </Link>{' '}
        and to Viewixsoft contacting you about this request.
      </p>

      <Turnstile onToken={setTurnstileToken} resetKey={turnstileReset} />

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-gradient mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-on-gradient hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSubmitting ? 'Sending…' : isFull ? 'Contact sales' : 'Get started'}
            {!isSubmitting && <ArrowRight aria-hidden="true" className="size-4" />}
          </button>
        )}
      </form.Subscribe>
    </form>
  )
}
