import { createFileRoute, useRouter } from '@tanstack/react-router'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { z } from 'zod'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { authClient } from '~/lib/auth-client'

const LoginSchema = z.object({
  email: z.string().trim().email('Enter your admin email'),
  password: z.string().min(1, 'Enter your password'),
})

const SearchSchema = z.object({
  // Only same-site admin paths, so the redirect can't send anyone off-site.
  redirect: z
    .string()
    .regex(/^\/admin(\/[a-z0-9/-]*)?$/)
    .optional()
    .catch(undefined),
})

export const Route = createFileRoute('/admin/login')({
  validateSearch: SearchSchema,
  component: LoginPage,
})

function firstError(errors: unknown[]) {
  for (const e of errors) {
    if (typeof e === 'string') return e
    if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') return e.message
  }
  return undefined
}

function LoginPage() {
  const { redirect } = Route.useSearch()
  const router = useRouter()
  const [error, setError] = useState('')

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validationLogic: revalidateLogic({ mode: 'submit', modeAfterSubmission: 'change' }),
    validators: { onDynamic: LoginSchema },
    onSubmit: async ({ value }) => {
      setError('')
      const res = await authClient.signIn.email({ email: value.email, password: value.password })
      if (res.error) {
        setError('Email or password is incorrect.')
        return
      }
      await router.invalidate()
      await router.navigate({ to: redirect ?? '/admin/leads' })
    },
  })

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-50">Admin sign in</h1>
      <p className="mt-2 text-sm text-ink-400">Accounts are created with pnpm admin:create.</p>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void form.handleSubmit()
        }}
        className="mt-8 space-y-5 rounded-2xl border border-ink-800 bg-ink-900 p-6"
      >
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {(['email', 'password'] as const).map((name) => (
          <form.Field key={name} name={name}>
            {(field) => {
              const message = form.state.submissionAttempts > 0 ? firstError(field.state.meta.errors) : undefined
              return (
                <div>
                  <Label htmlFor={`login-${name}`}>{name === 'email' ? 'Email' : 'Password'}</Label>
                  <Input
                    id={`login-${name}`}
                    name={name}
                    type={name}
                    autoComplete={name === 'email' ? 'username' : 'current-password'}
                    required
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={message ? true : undefined}
                    aria-describedby={message ? `login-${name}-error` : undefined}
                    className="mt-2 h-11 bg-ink-950 text-ink-50"
                  />
                  {message && (
                    <p id={`login-${name}-error`} className="mt-1.5 text-xs text-destructive">
                      {message}
                    </p>
                  )}
                </div>
              )
            }}
          </form.Field>
        ))}
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-brand-gradient w-full rounded-lg px-5 py-3 text-sm font-semibold text-on-gradient hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          )}
        </form.Subscribe>
      </form>
    </div>
  )
}
