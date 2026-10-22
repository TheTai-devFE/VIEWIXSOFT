import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Reveal } from '~/components/ui/reveal'
import { PRODUCTS, PRODUCT_ONE_LINERS } from '~/content/products'
import type { Product } from '~/content/products'
import { NewsletterSchema } from '~/server/schema/validation'
import { subscribeNewsletterFn } from '~/server/functions/leads'

// The product slug is added on submit, so the form only collects these two.
const NotifySchema = NewsletterSchema.pick({ email: true, consent: true })

function firstError(meta: { errors: unknown[]; isBlurred: boolean }, attempts: number) {
  if (!meta.isBlurred && attempts === 0) return undefined
  for (const e of meta.errors) {
    if (typeof e === 'string') return e
    if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') return e.message
  }
  return undefined
}

/** Shown on /products/$slug while a product's status is coming-soon. */
export function ProductComingSoon({ product }: { product: Product }) {
  const others = PRODUCTS.filter((p) => p.slug !== product.slug)

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-20 lg:px-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-400">
        <Link to="/" className="hover:text-ink-200">
          Home
        </Link>
        <ChevronRight aria-hidden="true" className="size-3.5 text-ink-600" />
        <Link to="/products" className="hover:text-ink-200">
          Products
        </Link>
        <ChevronRight aria-hidden="true" className="size-3.5 text-ink-600" />
        <span aria-current="page" className="font-semibold text-signal-400">
          {product.name}
        </span>
      </nav>

      <div className="mt-12 grid items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-signal-800 bg-signal-950 px-3 py-1 text-xs font-semibold text-signal-300">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-signal-400 motion-safe:animate-led" />
            Coming soon
          </span>
          <h1 className="mt-5 font-display text-5xl font-semibold tracking-tight text-balance text-ink-50 sm:text-6xl">
            {product.name}
          </h1>
          <p className="mt-5 text-xl text-pretty text-ink-200">{PRODUCT_ONE_LINERS[product.slug]}</p>
          <p className="mt-4 max-w-xl text-pretty text-ink-400">
            {product.name} is in development. It will connect to Viewixsoft CMS, so the screens you set up today will
            be ready for it on launch day.
          </p>

          <NotifyForm product={product} />

          <p className="mt-8 text-sm text-ink-400">
            Need your screens running now?{' '}
            <Link
              to="/products/$slug"
              params={{ slug: 'cms' }}
              preload="intent"
              className="font-semibold text-signal-400 hover:text-signal-300"
            >
              Start with Viewixsoft CMS
            </Link>
          </p>
        </Reveal>

        <Reveal variant="scale" delay={120}>
          <LaunchScreen name={product.name} />
        </Reveal>
      </div>

      <section aria-labelledby="other-products-title" className="mt-24 border-t border-ink-800 pt-12">
        <h2 id="other-products-title" className="font-display text-2xl font-semibold text-ink-50">
          Other Viewixsoft products
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {others.map((p) => (
            <li key={p.slug}>
              <Link
                to="/products/$slug"
                params={{ slug: p.slug }}
                preload="intent"
                className="group flex h-full flex-col rounded-2xl border border-ink-800 p-5 transition-colors hover:border-ink-600"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-display font-semibold text-ink-50 group-hover:text-signal-400">{p.name}</span>
                  <span className="rounded-full bg-ink-900 px-2 py-0.5 font-mono text-[10px] tracking-widest text-ink-400 uppercase">
                    {p.status === 'available' ? 'Available' : 'Soon'}
                  </span>
                </span>
                <span className="mt-2 text-sm text-ink-400">{PRODUCT_ONE_LINERS[p.slug]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function NotifyForm({ product }: { product: Product }) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [sentTo, setSentTo] = useState('')

  const form = useForm({
    defaultValues: { email: '', consent: false },
    validationLogic: revalidateLogic({ mode: 'blur', modeAfterSubmission: 'change' }),
    validators: { onDynamic: NotifySchema },
    onSubmit: async ({ value }) => {
      setStatus('idle')
      try {
        const slug = NewsletterSchema.shape.product.unwrap().parse(product.slug)
        const res = await subscribeNewsletterFn({ data: { ...value, product: slug } })
        if (!res.success) throw new Error('rejected')
        setSentTo(value.email)
        setStatus('success')
      } catch {
        setStatus('error')
      }
    },
  })

  if (status === 'success') {
    return (
      <div role="status" className="mt-8 flex max-w-xl items-start gap-3 rounded-2xl border border-ink-800 bg-ink-900 p-5">
        <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-signal-400" />
        <p className="text-sm text-ink-300">
          You are on the list. We will email <strong className="text-ink-50">{sentTo}</strong> when {product.name}{' '}
          launches.
        </p>
      </div>
    )
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
      className="mt-8 max-w-xl"
    >
      {status === 'error' && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          We couldn't save your email. Please try again.
        </p>
      )}
      <form.Field name="email">
        {(field) => {
          const error = firstError(field.state.meta, form.state.submissionAttempts)
          return (
            <div>
              <Label htmlFor="notify-email">Work email</Label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <Input
                  id="notify-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'notify-email-error' : undefined}
                  className="h-11 bg-ink-900 text-ink-50"
                />
                <form.Subscribe selector={(s) => s.isSubmitting}>
                  {(isSubmitting) => (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-brand-gradient inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold text-on-gradient hover:opacity-90 disabled:opacity-60"
                    >
                      {isSubmitting ? 'Sending…' : 'Notify me'}
                      {!isSubmitting && <ArrowRight aria-hidden="true" className="size-4" />}
                    </button>
                  )}
                </form.Subscribe>
              </div>
              {error && (
                <p id="notify-email-error" className="mt-1.5 text-xs text-destructive">
                  {error}
                </p>
              )}
            </div>
          )
        }}
      </form.Field>

      <form.Field name="consent">
        {(field) => {
          const error = firstError(field.state.meta, form.state.submissionAttempts)
          return (
            <div className="mt-4">
              <div className="flex items-start gap-3">
                <input
                  id="notify-consent"
                  type="checkbox"
                  name="consent"
                  required
                  checked={field.state.value}
                  onChange={(e) => field.handleChange(e.target.checked)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'notify-consent-error' : undefined}
                  className="mt-0.5 size-4 shrink-0 accent-signal-500"
                />
                <label htmlFor="notify-consent" className="text-sm text-ink-400">
                  Email me when {product.name} launches. I agree to the{' '}
                  <Link to="/legal/privacy" className="text-signal-400 underline hover:text-signal-300">
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>
              {error && (
                <p id="notify-consent-error" className="mt-1.5 text-xs text-destructive">
                  {error}
                </p>
              )}
            </div>
          )
        }}
      </form.Field>
    </form>
  )
}

/** A screen "booting up" the product: decorative, so hidden from assistive tech. */
function LaunchScreen({ name }: { name: string }) {
  return (
    <div aria-hidden="true" className="mx-auto max-w-lg">
      <div className="rounded-3xl border border-ink-700 p-3 shadow-lg" style={{ background: 'var(--surface-bezel)' }}>
        <div className="bg-brand-gradient relative flex aspect-video flex-col justify-between overflow-hidden rounded-2xl p-6 text-on-gradient sm:p-8">
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase opacity-80">Launching soon</span>
          <div>
            <p className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{name}</p>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-on-gradient/25">
              <div className="h-full w-2/5 rounded-full bg-on-gradient motion-safe:animate-progress" />
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto h-10 w-3 border-x border-ink-700 bg-ink-900" />
      <div className="mx-auto h-2.5 w-36 rounded-full border border-ink-700 bg-ink-900" />
    </div>
  )
}
