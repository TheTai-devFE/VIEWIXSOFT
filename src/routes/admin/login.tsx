import { createFileRoute, useRouter } from '@tanstack/react-router'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { z } from 'zod'
import { ViewixLogo } from '~/components/blocks/ViewixLogo'
import { FieldInput } from '~/components/ui/field-input'
import { MagicCard } from '~/components/ui/magic-card'
import { StatefulButton } from '~/components/ui/stateful-button'
import type { ButtonState } from '~/components/ui/stateful-button'
import { authClient } from '~/lib/auth-client'

const LoginSchema = z.object({
  email: z.string().trim().email('Nhập email quản trị của bạn'),
  password: z.string().min(1, 'Nhập mật khẩu'),
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
  const [revealPassword, setRevealPassword] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validationLogic: revalidateLogic({ mode: 'submit', modeAfterSubmission: 'change' }),
    validators: { onDynamic: LoginSchema },
    onSubmit: async ({ value }) => {
      setError('')
      const res = await authClient.signIn.email({ email: value.email, password: value.password })
      if (res.error) {
        setError('Email hoặc mật khẩu không đúng.')
        return
      }
      setSignedIn(true)
      await router.invalidate()
      await router.navigate({ to: redirect ?? '/admin' })
    },
  })

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <ViewixLogo className="mx-auto h-6 text-ink-50" title="Viewixsoft" withSoft />
        <MagicCard className="mt-8">
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              void form.handleSubmit()
            }}
            className="flex flex-col gap-5 p-6 sm:p-8"
          >
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-50">Đăng nhập quản trị</h1>
              <p className="text-sm text-ink-400">
                Tài khoản được tạo bằng lệnh <code className="font-mono text-xs">pnpm admin:create</code>.
              </p>
            </div>

            {error && (
              <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-1">
              <form.Field name="email">
                {(field) => {
                  const message = form.state.submissionAttempts > 0 ? firstError(field.state.meta.errors) : undefined
                  const valid = field.state.meta.isTouched && LoginSchema.shape.email.safeParse(field.state.value).success
                  return (
                    <FieldInput
                      id="login-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      label="Email"
                      autoComplete="username"
                      required
                      leftIcon={<Mail />}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={field.handleChange}
                      error={message}
                      success={valid && !message}
                      reserveErrorLine
                    />
                  )
                }}
              </form.Field>

              <form.Field name="password">
                {(field) => {
                  const message = form.state.submissionAttempts > 0 ? firstError(field.state.meta.errors) : undefined
                  return (
                    <FieldInput
                      id="login-password"
                      name="password"
                      type={revealPassword ? 'text' : 'password'}
                      label="Mật khẩu"
                      autoComplete="current-password"
                      required
                      leftIcon={<Lock />}
                      rightSlot={
                        <button
                          type="button"
                          onClick={() => setRevealPassword((prev) => !prev)}
                          aria-label={revealPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          aria-controls="login-password"
                          className="rounded-full outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                        >
                          {revealPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                        </button>
                      }
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={field.handleChange}
                      error={message}
                      reserveErrorLine
                    />
                  )
                }}
              </form.Field>
            </div>

            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => {
                const state: ButtonState = signedIn ? 'success' : isSubmitting ? 'loading' : 'idle'
                return (
                  <StatefulButton
                    type="submit"
                    size="lg"
                    state={state}
                    loadingText="Đang đăng nhập"
                    successText="Đã đăng nhập"
                    className="h-11 w-full rounded-full font-semibold"
                  >
                    Đăng nhập
                  </StatefulButton>
                )
              }}
            </form.Subscribe>
          </form>
        </MagicCard>
      </div>
    </main>
  )
}
