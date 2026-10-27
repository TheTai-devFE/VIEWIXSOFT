import { useId, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { Check, CheckCircle2 } from 'lucide-react'
import { Turnstile } from '~/components/ui/turnstile'
import { cn } from '~/lib/cn'
import { TOPIC_CHIPS, toggleTopic } from '~/lib/newsletter-topics'
import { subscribeNewsletterFn } from '~/server/functions/leads'
import { NewsletterSchema } from '~/server/schema/validation'
import type { NewsletterTopic } from '~/server/schema/validation'

// Topics live outside the form state: they always hold a valid value.
const SignupSchema = NewsletterSchema.pick({ email: true, consent: true })

function shownError(meta: { errors: unknown[]; isBlurred: boolean }, attempts: number) {
  if (!meta.isBlurred && attempts === 0) return undefined
  for (const e of meta.errors) {
    if (typeof e === 'string') return e
    if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') return e.message
  }
  return undefined
}

interface SubscribeFormProps {
  /** Chips picked at first, e.g. the product on its coming-soon page. */
  defaultTopics?: NewsletterTopic[]
  submitLabel?: string
  align?: 'center' | 'start'
  className?: string
}

/**
 * Email sign-up with topic chips (double opt-in: a confirmation email is sent
 * first). "All updates" is the newsletter; product chips add launch news.
 */
export function SubscribeForm({ defaultTopics = ['newsletter'], submitLabel = 'Subscribe', align = 'center', className }: SubscribeFormProps) {
  const uid = useId()
  const id = (name: string) => `${uid}-${name}`
  const [topics, setTopics] = useState<NewsletterTopic[]>(defaultTopics.length > 0 ? defaultTopics : ['newsletter'])
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
        const res = await subscribeNewsletterFn({ data: { ...value, topics, turnstileToken: token } })
        setMessage(res.message)
        if (res.ok) return setStatus('success')
      } catch {
        setMessage("We couldn't save your email. Please try again.")
      }
      setReset((n) => n + 1)
      setStatus('error')
    },
  })

  const centered = align === 'center'

  if (status === 'success') {
    return (
      <p
        role="status"
        className={cn('flex items-start gap-3 text-sm text-ink-300', centered && 'justify-center text-left', className)}
      >
        <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-signal-400" />
        {message}
      </p>
    )
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
      className={cn('w-full max-w-3xl', centered && 'mx-auto', className)}
    >
      {status === 'error' && (
        <p role="alert" className={cn('mb-4 text-sm text-destructive', centered && 'text-center')}>
          {message}
        </p>
      )}

      <fieldset>
        <legend className="sr-only">Topics</legend>
        <div className={cn('flex flex-wrap gap-2', centered && 'justify-center')}>
          {TOPIC_CHIPS.map(({ topic, label }) => {
            const picked = topics.includes(topic)
            return (
              <label key={topic} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="topics"
                  value={topic}
                  checked={picked}
                  onChange={() => setTopics((current) => toggleTopic(current, topic))}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    'inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50',
                    picked
                      ? 'border-ink-50 bg-ink-50 text-ink-950'
                      : 'border-ink-700 bg-ink-950 text-ink-300 hover:border-ink-500 hover:text-ink-50',
                  )}
                >
                  {picked && <Check aria-hidden="true" className="size-3.5" />}
                  {label}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <form.Field name="email">
        {(field) => {
          const error = shownError(field.state.meta, form.state.submissionAttempts)
          return (
            <div className="mt-4">
              <label htmlFor={id('email')} className="sr-only">
                Work email
              </label>
              {/* One pill on tablet and up; stacked on phones so the button stays full width. */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:border sm:border-ink-700 sm:bg-ink-950 sm:p-1.5 sm:focus-within:border-ink-500 sm:focus-within:ring-[3px] sm:focus-within:ring-ring/50">
                <input
                  id={id('email')}
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your work email"
                  required
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? id('email-error') : undefined}
                  className="h-12 w-full min-w-0 rounded-full border border-ink-700 bg-ink-950 px-5 text-base text-ink-50 outline-none placeholder:text-ink-500 focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive sm:h-11 sm:border-0 sm:bg-transparent sm:focus-visible:ring-0"
                />
                <form.Subscribe selector={(s) => s.isSubmitting}>
                  {(isSubmitting) => (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      aria-busy={isSubmitting || undefined}
                      className="bg-brand-gradient shine h-12 shrink-0 rounded-full px-6 text-sm font-semibold text-on-gradient transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:h-11"
                    >
                      {isSubmitting ? 'Sending…' : submitLabel}
                    </button>
                  )}
                </form.Subscribe>
              </div>
              {error && (
                <p id={id('email-error')} className={cn('mt-1.5 text-xs text-destructive', centered && 'text-center')}>
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
            <div className="mt-4">
              <div className={cn('flex items-start gap-3', centered && 'justify-center')}>
                <input
                  id={id('consent')}
                  type="checkbox"
                  name="consent"
                  required
                  checked={field.state.value}
                  onChange={(e) => field.handleChange(e.target.checked)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? id('consent-error') : undefined}
                  className="mt-0.5 size-4 shrink-0 accent-signal-500"
                />
                <label htmlFor={id('consent')} className="text-left text-sm text-ink-400">
                  Email me Viewixsoft news on the topics above. I agree to the{' '}
                  <Link to="/legal/privacy" className="text-ink-200 underline hover:text-signal-400">
                    Privacy Policy
                  </Link>
                  . Unsubscribe anytime.
                </label>
              </div>
              {error && (
                <p id={id('consent-error')} className={cn('mt-1.5 text-xs text-destructive', centered && 'text-center')}>
                  {error}
                </p>
              )}
            </div>
          )
        }}
      </form.Field>

      <div className={cn('mt-4 flex', centered && 'justify-center')}>
        <Turnstile onToken={setToken} resetKey={reset} />
      </div>
    </form>
  )
}
