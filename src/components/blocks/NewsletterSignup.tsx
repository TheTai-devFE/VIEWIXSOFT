import { useId, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { CheckCircle2 } from 'lucide-react'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Turnstile } from '~/components/ui/turnstile'
import { subscribeNewsletterFn } from '~/server/functions/leads'
import { NewsletterSchema } from '~/server/schema/validation'

const SignupSchema = NewsletterSchema.pick({ email: true, consent: true })

function shownError(meta: { errors: unknown[]; isBlurred: boolean }, attempts: number) {
  if (!meta.isBlurred && attempts === 0) return undefined
  for (const e of meta.errors) {
    if (typeof e === 'string') return e
    if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') return e.message
  }
  return undefined
}

/** Newsletter sign-up with double opt-in (a confirmation email is sent first). */
export function NewsletterSignup({
  title = 'Get new guides by email',
  description = 'One email when we publish something useful about running digital signage. No spam, unsubscribe any time.',
}: {
  title?: string
  description?: string
}) {
  const uid = useId()
  const id = (name: string) => `${uid}-${name}`
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [token, setToken] = useState<string | undefined>()
  const [reset, setReset] = useState(0)

  const form = useForm({
    defaultValues: { email: '', consent: false },
    validationLogic: revalidateLogic({ mode: 'blur', modeAfterSubmission: 'change' }),
    validators: { onDynamic: SignupSchema },
    onSubmit: async ({ value }) => {
      setStatus('idle')
      try {
        const res = await subscribeNewsletterFn({ data: { ...value, turnstileToken: token } })
        setMessage(res.message)
        if (res.ok) return setStatus('success')
      } catch {
        setMessage("We couldn't save your email. Please try again.")
      }
      setReset((n) => n + 1)
      setStatus('error')
    },
  })

  return (
    <section aria-labelledby={id('title')} className="rounded-3xl border border-ink-800 bg-ink-900 p-8 sm:p-10">
      <h2 id={id('title')} className="font-display text-2xl font-semibold tracking-tight text-ink-50">
        {title}
      </h2>
      <p className="mt-2 text-ink-400">{description}</p>

      {status === 'success' ? (
        <p role="status" className="mt-6 flex items-start gap-3 text-sm text-ink-300">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-signal-400" />
          {message}
        </p>
      ) : (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void form.handleSubmit()
          }}
          className="mt-6 max-w-xl space-y-4"
        >
          {status === 'error' && (
            <p role="alert" className="text-sm text-destructive">
              {message}
            </p>
          )}
          <form.Field name="email">
            {(field) => {
              const error = shownError(field.state.meta, form.state.submissionAttempts)
              return (
                <div>
                  <Label htmlFor={id('email')}>Work email</Label>
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                    <Input
                      id={id('email')}
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? id('email-error') : undefined}
                      className="h-11 bg-ink-950 text-ink-50"
                    />
                    <form.Subscribe selector={(s) => s.isSubmitting}>
                      {(isSubmitting) => (
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-brand-gradient h-11 shrink-0 rounded-lg px-5 text-sm font-semibold text-on-gradient hover:opacity-90 disabled:opacity-60"
                        >
                          {isSubmitting ? 'Sending…' : 'Subscribe'}
                        </button>
                      )}
                    </form.Subscribe>
                  </div>
                  {error && (
                    <p id={id('email-error')} className="mt-1.5 text-xs text-destructive">
                      {error}
                    </p>
                  )}
                </div>
              )
            }}
          </form.Field>
          <form.Field name="consent">
            {(field) => {
              const error = shownError(field.state.meta, form.state.submissionAttempts)
              return (
                <div>
                  <div className="flex items-start gap-3">
                    <input
                      id={id('consent')}
                      type="checkbox"
                      required
                      checked={field.state.value}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? id('consent-error') : undefined}
                      className="mt-0.5 size-4 shrink-0 accent-signal-500"
                    />
                    <label htmlFor={id('consent')} className="text-sm text-ink-400">
                      Email me Viewixsoft guides and product news. I agree to the{' '}
                      <Link to="/legal/privacy" className="text-signal-400 underline hover:text-signal-300">
                        Privacy Policy
                      </Link>
                      .
                    </label>
                  </div>
                  {error && (
                    <p id={id('consent-error')} className="mt-1.5 text-xs text-destructive">
                      {error}
                    </p>
                  )}
                </div>
              )
            }}
          </form.Field>
          <Turnstile onToken={setToken} resetKey={reset} />
        </form>
      )}
    </section>
  )
}
