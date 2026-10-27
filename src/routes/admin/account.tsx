import { createFileRoute } from '@tanstack/react-router'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { z } from 'zod'
import { AdminPageHeader, firstError } from '~/components/admin/admin-ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { PasswordSchema } from '~/lib/admin-schemas'
import { authClient } from '~/lib/auth-client'
import { PERMISSION_LABELS } from '~/lib/permissions'

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Nhập mật khẩu hiện tại'),
    newPassword: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], message: 'Hai mật khẩu mới chưa khớp' })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ['newPassword'], message: 'Mật khẩu mới phải khác mật khẩu cũ' })

const FIELDS = [
  { name: 'currentPassword', label: 'Mật khẩu hiện tại', autoComplete: 'current-password' },
  { name: 'newPassword', label: 'Mật khẩu mới (ít nhất 12 ký tự)', autoComplete: 'new-password' },
  { name: 'confirmPassword', label: 'Nhập lại mật khẩu mới', autoComplete: 'new-password' },
] as const

export const Route = createFileRoute('/admin/account')({
  component: AccountPage,
})

function AccountPage() {
  const { admin } = Route.useRouteContext()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const form = useForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validationLogic: revalidateLogic({ mode: 'submit', modeAfterSubmission: 'change' }),
    validators: { onDynamic: ChangePasswordSchema },
    onSubmit: async ({ value, formApi }) => {
      setResult(null)
      const res = await authClient.changePassword({
        currentPassword: value.currentPassword,
        newPassword: value.newPassword,
        revokeOtherSessions: true,
      })
      if (res.error) {
        setResult({ ok: false, message: 'Mật khẩu hiện tại không đúng, hoặc chưa đổi được. Hãy thử lại.' })
        return
      }
      formApi.reset()
      setResult({ ok: true, message: 'Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất.' })
    },
  })

  if (!admin) return null

  return (
    <>
      <AdminPageHeader title="Tài khoản của tôi" description="Thông tin đăng nhập và quyền của bạn." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{admin.name}</CardTitle>
            <CardDescription className="break-all">{admin.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Vai trò: <strong>{admin.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}</strong>
            </p>
            {admin.role === 'admin' ? (
              <p className="text-muted-foreground">Bạn dùng được mọi mục và quản lý tài khoản khác.</p>
            ) : (
              <p className="text-muted-foreground">
                Được dùng: {admin.permissions.map((p) => PERMISSION_LABELS[p].label).join(', ') || 'chưa có mục nào'}. Cần thêm
                quyền, hãy nhờ Quản trị viên.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Đổi mật khẩu</CardTitle>
            <CardDescription>Nên đổi ngay mật khẩu tạm mà Quản trị viên đã cấp.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault()
                void form.handleSubmit()
              }}
              className="space-y-4"
            >
              {result && (
                <p
                  role={result.ok ? 'status' : 'alert'}
                  className={
                    result.ok
                      ? 'rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success'
                      : 'rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive'
                  }
                >
                  {result.message}
                </p>
              )}
              {FIELDS.map(({ name, label, autoComplete }) => (
                <form.Field key={name} name={name}>
                  {(field) => {
                    const message = form.state.submissionAttempts > 0 ? firstError(field.state.meta.errors) : undefined
                    return (
                      <div>
                        <Label htmlFor={`account-${name}`} className="text-xs text-muted-foreground">
                          {label}
                        </Label>
                        <Input
                          id={`account-${name}`}
                          name={name}
                          type="password"
                          autoComplete={autoComplete}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={message ? true : undefined}
                          aria-describedby={message ? `account-${name}-error` : undefined}
                          className="mt-1"
                        />
                        {message && (
                          <p id={`account-${name}-error`} className="mt-1 text-xs text-destructive">
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
                    className="bg-brand-gradient rounded-lg px-4 py-2 text-sm font-semibold text-on-gradient hover:opacity-90 disabled:opacity-60"
                  >
                    {isSubmitting ? 'Đang lưu…' : 'Đổi mật khẩu'}
                  </button>
                )}
              </form.Subscribe>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
