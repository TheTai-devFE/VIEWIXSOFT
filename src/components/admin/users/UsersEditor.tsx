import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { Eye, EyeOff, KeyRound, Loader2, Lock, LogOut, Pencil, Plus, Trash2, Unlock, Wand2 } from 'lucide-react'
import { AccessFields } from '~/components/admin/users/AccessFields'
import { describeIssue } from '~/components/admin/use-cases/form-errors'
import { TextField } from '~/components/admin/use-cases/BlockFields'
import { AnimatedBadge } from '~/components/ui/animated-badge'
import { useConfirm, useToast } from '~/components/ui/feedback'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { PasswordSchema, UserCreateSchema, UserUpdateSchema } from '~/lib/admin-schemas'
import { PERMISSION_LABELS } from '~/lib/permissions'
import type { Permission, Role } from '~/lib/permissions'
import {
  createUserFn,
  deleteUserFn,
  revokeUserSessionsFn,
  setUserBannedFn,
  setUserPasswordFn,
  updateUserFn,
} from '~/server/functions/users'

export interface UserItem {
  id: string
  name: string
  email: string
  role: Role
  permissions: Permission[]
  banned: boolean
  createdAt: Date | string
}

const btnSecondary = 'inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50'
const btnPrimary =
  'bg-brand-gradient rounded-lg px-4 py-2 text-sm font-semibold text-on-gradient hover:opacity-90 disabled:opacity-50'

/** 16 characters from an alphabet without look-alikes (0/O, 1/l/I), so it can be read out or retyped. */
function randomPassword() {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint32Array(16))
  return Array.from(bytes, (n) => chars[n % chars.length]).join('')
}

function Errors({ errors }: { errors: string[] }) {
  if (!errors.length) return null
  return (
    <ul role="alert" className="list-disc space-y-1 rounded-xl border border-destructive/40 bg-destructive/10 p-4 pl-8 text-sm text-destructive">
      {errors.map((e) => (
        <li key={e}>{e}</li>
      ))}
    </ul>
  )
}

function PasswordField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  const [reveal, setReveal] = useState(false)
  return (
    <div>
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <div className="mt-1 flex gap-2">
        <div className="relative flex-1">
          <Input
            id={id}
            type={reveal ? 'text' : 'password'}
            autoComplete="new-password"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-describedby={`${id}-hint`}
            className="pr-10 font-mono"
          />
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-controls={id}
            className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {reveal ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            onChange(randomPassword())
            setReveal(true)
          }}
          className={btnSecondary}
        >
          <Wand2 aria-hidden="true" className="size-3.5" /> Tạo ngẫu nhiên
        </button>
      </div>
      <p id={`${id}-hint`} className="mt-1 text-[11px] text-muted-foreground">
        Ít nhất 12 ký tự. Gửi riêng cho người dùng (không gửi qua kênh công khai) và nhắc họ đổi trong "Tài khoản của tôi".
      </p>
    </div>
  )
}

/** New account: name, email, temporary password and access. */
function CreateUserForm({ onDone }: { onDone: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' as Role, permissions: [] as Permission[] })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const save = async () => {
    const parsed = UserCreateSchema.safeParse(form)
    if (!parsed.success) return setErrors(parsed.error.issues.map(describeIssue))
    setErrors([])
    setSaving(true)
    try {
      const res = await createUserFn({ data: parsed.data })
      if (!res.ok) return setErrors([res.error])
      await router.invalidate()
      onDone()
    } catch {
      setErrors(['Không tạo được tài khoản. Hãy thử lại.'])
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <Errors errors={errors} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="new-user-name" label="Họ tên *" value={form.name} onChange={(name) => setForm((f) => ({ ...f, name }))} placeholder="Linh Tran" />
        <TextField id="new-user-email" label="Email đăng nhập *" value={form.email} onChange={(email) => setForm((f) => ({ ...f, email }))} placeholder="linh@viewixsoft.com" />
        <div className="sm:col-span-2">
          <PasswordField id="new-user-password" label="Mật khẩu tạm *" value={form.password} onChange={(password) => setForm((f) => ({ ...f, password }))} />
        </div>
      </div>
      <AccessFields id="new-user" role={form.role} permissions={form.permissions} onChange={(access) => setForm((f) => ({ ...f, ...access }))} />
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onDone} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent">
          Huỷ
        </button>
        <button type="button" onClick={save} disabled={saving} className={btnPrimary}>
          {saving ? 'Đang tạo…' : 'Tạo tài khoản'}
        </button>
      </div>
    </div>
  )
}

/** Name, role and modules of an existing account. */
function EditUserForm({ user, isSelf, onDone }: { user: UserItem; isSelf: boolean; onDone: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: user.name, role: user.role, permissions: user.permissions })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const save = async () => {
    const parsed = UserUpdateSchema.safeParse({ ...form, userId: user.id })
    if (!parsed.success) return setErrors(parsed.error.issues.map(describeIssue))
    setErrors([])
    setSaving(true)
    try {
      const res = await updateUserFn({ data: parsed.data })
      if (!res.ok) return setErrors([res.error])
      await router.invalidate()
      onDone()
    } catch {
      setErrors(['Không lưu được. Hãy thử lại.'])
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <Errors errors={errors} />
      <TextField id={`${user.id}-name`} label="Họ tên *" value={form.name} onChange={(name) => setForm((f) => ({ ...f, name }))} />
      <AccessFields
        id={user.id}
        role={form.role}
        permissions={form.permissions}
        roleLocked={isSelf}
        onChange={(access) => setForm((f) => ({ ...f, ...access }))}
      />
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onDone} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent">
          Huỷ
        </button>
        <button type="button" onClick={save} disabled={saving} className={btnPrimary}>
          {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
        </button>
      </div>
    </div>
  )
}

function ResetPasswordForm({ user, onDone }: { user: UserItem; onDone: (message: string) => void }) {
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const save = async () => {
    const parsed = PasswordSchema.safeParse(password)
    if (!parsed.success) return setErrors(parsed.error.issues.map((i) => i.message))
    setErrors([])
    setSaving(true)
    try {
      const res = await setUserPasswordFn({ data: { userId: user.id, password: parsed.data } })
      if (!res.ok) return setErrors([res.error])
      onDone(`${user.email} đã bị đăng xuất khỏi mọi thiết bị và cần dùng mật khẩu mới.`)
    } catch {
      setErrors(['Không đặt được mật khẩu. Hãy thử lại.'])
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      <Errors errors={errors} />
      <PasswordField id={`${user.id}-password`} label="Mật khẩu mới" value={password} onChange={setPassword} />
      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => onDone('')} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent">
          Huỷ
        </button>
        <button type="button" onClick={save} disabled={saving} className={btnPrimary}>
          {saving ? 'Đang lưu…' : 'Đặt mật khẩu'}
        </button>
      </div>
    </div>
  )
}

function AccessSummary({ user }: { user: UserItem }) {
  if (user.role === 'admin') return <p className="mt-1 text-sm">Mọi mục, gồm cả quản lý tài khoản.</p>
  if (!user.permissions.length) {
    return <p className="mt-1 text-sm text-muted-foreground">Chưa có quyền nào: chỉ vào được "Tài khoản của tôi".</p>
  }
  return (
    <ul className="mt-1.5 flex flex-wrap gap-1.5">
      {user.permissions.map((p) => (
        <li key={p} className="rounded-full border border-border px-2.5 py-0.5 text-xs">
          {PERMISSION_LABELS[p].label}
        </li>
      ))}
    </ul>
  )
}

/** Accounts for /admin and what each may use. Only admins reach this screen. */
export function UsersEditor({
  users,
  authorByUser,
  currentUserId,
}: {
  users: UserItem[]
  /** Author profile name by account id, for accounts linked in /admin/authors. */
  authorByUser: Record<string, string>
  currentUserId: string
}) {
  const router = useRouter()
  // Which panel is open: 'new', `edit:<id>`, `password:<id>`, or none.
  const [open, setOpen] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const confirm = useConfirm()
  const toast = useToast()

  type Call = () => Promise<{ ok: true } | { ok: false; error: string }>

  /** Runs a call, refreshes the list and reports the outcome; returns the error, if any, for the dialog. */
  const run = async (call: Call, done: string) => {
    const res = await call()
    if (!res.ok) return res.error
    await router.invalidate()
    toast({ title: done, tone: 'success' })
  }

  const confirmThen = (options: { title: string; description: string; confirmText: string; danger?: boolean }, call: Call, done: string) =>
    confirm({ ...options, tone: options.danger ? 'danger' : 'default', onConfirm: () => run(call, done) })

  /** For changes that need no confirmation (unlocking): a spinner on the button, errors in a toast. */
  const runNow = async (key: string, call: Call, done: string) => {
    setBusy(key)
    try {
      const problem = await run(call, done)
      if (problem) toast({ title: 'Không thực hiện được', description: problem, tone: 'error' })
    } catch {
      toast({ title: 'Không thực hiện được', description: 'Hãy thử lại.', tone: 'error' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      {open === 'new' ? (
        <Card>
          <CardHeader>
            <CardTitle>Tạo tài khoản</CardTitle>
            <CardDescription>Người dùng đăng nhập ở /admin/login bằng email và mật khẩu tạm này.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateUserForm onDone={() => setOpen(null)} />
          </CardContent>
        </Card>
      ) : (
        <button type="button" onClick={() => setOpen('new')} className={`${btnPrimary} inline-flex items-center gap-2`}>
          <Plus aria-hidden="true" className="size-4" /> Tạo tài khoản
        </button>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {users.map((u) => {
          const isSelf = u.id === currentUserId
          return (
            <Card key={u.id} className={u.banned ? 'opacity-75' : undefined}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  {u.name}
                  {isSelf && <AnimatedBadge status="info" size="sm">Bạn</AnimatedBadge>}
                </CardTitle>
                <CardDescription className="break-all">{u.email}</CardDescription>
                <CardAction className="flex flex-wrap justify-end gap-1.5">
                  <AnimatedBadge status={u.role === 'admin' ? 'success' : 'neutral'} size="sm">
                    {u.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                  </AnimatedBadge>
                  {u.banned && <AnimatedBadge status="danger" size="sm">Đã khoá</AnimatedBadge>}
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-4">
                {open === `edit:${u.id}` ? (
                  <EditUserForm user={u} isSelf={isSelf} onDone={() => setOpen(null)} />
                ) : (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Được dùng</p>
                      <AccessSummary user={u} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tác giả liên kết:{' '}
                      {authorByUser[u.id] ? (
                        <strong className="font-medium text-foreground">{authorByUser[u.id]}</strong>
                      ) : (
                        <>
                          chưa có.{' '}
                          <Link to="/admin/authors" className="font-semibold text-signal-400 hover:text-signal-300">
                            Gắn trong Tác giả →
                          </Link>
                        </>
                      )}
                    </p>

                    {open === `password:${u.id}` && (
                      <ResetPasswordForm
                        user={u}
                        onDone={(message) => {
                          setOpen(null)
                          if (message) toast({ title: 'Đã đặt mật khẩu mới', description: message, tone: 'success' })
                        }}
                      />
                    )}

                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setOpen(`edit:${u.id}`)} className={btnSecondary}>
                        <Pencil aria-hidden="true" className="size-3.5" /> Sửa quyền
                      </button>
                      {!isSelf && (
                        <>
                          <button type="button" onClick={() => setOpen(`password:${u.id}`)} className={btnSecondary}>
                            <KeyRound aria-hidden="true" className="size-3.5" /> Đặt lại mật khẩu
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              confirmThen(
                                {
                                  title: 'Đăng xuất khỏi mọi thiết bị?',
                                  description: `${u.email} sẽ phải đăng nhập lại trên mọi máy.`,
                                  confirmText: 'Đăng xuất',
                                },
                                () => revokeUserSessionsFn({ data: { userId: u.id } }),
                                `Đã đăng xuất ${u.email} khỏi mọi thiết bị.`,
                              )
                            }
                            className={btnSecondary}
                          >
                            <LogOut aria-hidden="true" className="size-3.5" /> Đăng xuất mọi nơi
                          </button>
                          {u.banned ? (
                            <button
                              type="button"
                              disabled={busy === `unban:${u.id}`}
                              aria-busy={busy === `unban:${u.id}`}
                              onClick={() => runNow(`unban:${u.id}`, () => setUserBannedFn({ data: { userId: u.id, banned: false } }), `Đã mở khoá ${u.email}.`)}
                              className={btnSecondary}
                            >
                              {busy === `unban:${u.id}` ? (
                                <Loader2 aria-hidden="true" className="size-3.5 animate-spin motion-reduce:animate-none" />
                              ) : (
                                <Unlock aria-hidden="true" className="size-3.5" />
                              )}
                              Mở khoá
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                confirmThen(
                                  {
                                    title: `Khoá tài khoản ${u.name}?`,
                                    description: `${u.email} bị đăng xuất ngay và không đăng nhập được cho đến khi được mở khoá.`,
                                    confirmText: 'Khoá tài khoản',
                                    danger: true,
                                  },
                                  () => setUserBannedFn({ data: { userId: u.id, banned: true } }),
                                  `Đã khoá ${u.email}.`,
                                )
                              }
                              className={btnSecondary}
                            >
                              <Lock aria-hidden="true" className="size-3.5" /> Khoá
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              confirmThen(
                                {
                                  title: `Xoá vĩnh viễn ${u.name}?`,
                                  description: `Tài khoản ${u.email} bị xoá và không thể hoàn tác. Bài viết đã đăng vẫn giữ nguyên.`,
                                  confirmText: 'Xoá tài khoản',
                                  danger: true,
                                },
                                () => deleteUserFn({ data: { userId: u.id } }),
                                `Đã xoá tài khoản ${u.email}.`,
                              )
                            }
                            className={`${btnSecondary} text-destructive`}
                          >
                            <Trash2 aria-hidden="true" className="size-3.5" /> Xoá
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
