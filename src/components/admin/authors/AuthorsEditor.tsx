import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Image as ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react'
import { ImagePickerSheet } from '~/components/admin/ImagePickerSheet'
import type { LibraryAsset } from '~/components/admin/ImagePickerSheet'
import { describeIssue } from '~/components/admin/use-cases/form-errors'
import { TextField, selectClass } from '~/components/admin/use-cases/BlockFields'
import { AnimatedBadge } from '~/components/ui/animated-badge'
import { useConfirm, useToast } from '~/components/ui/feedback'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import { AuthorFormSchema } from '~/lib/admin-schemas'
import type { AuthorFormInput } from '~/lib/admin-schemas'
import { createAuthorFn, deleteAuthorFn, updateAuthorFn } from '~/server/functions/authors'
import type { AuthorRow } from '~/server/db/schema'
import { LazyImage } from '~/components/ui/lazy-image'

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const EMPTY: AuthorFormInput = { name: '', slug: '', role: '', bio: '', avatarUrl: '', profileUrl: '', kind: 'person', userId: null }

function toForm(a: AuthorRow): AuthorFormInput {
  return { name: a.name, slug: a.slug, role: a.role, bio: a.bio, avatarUrl: a.avatarUrl ?? '', profileUrl: a.profileUrl ?? '', kind: a.kind, userId: a.userId }
}

/** One author's profile form, for a new author or an existing one. */
export interface AccountOption {
  id: string
  name: string
}

function AuthorForm({
  author,
  assets,
  accounts,
  linkedUserIds,
  onDone,
}: {
  author?: AuthorRow
  assets: LibraryAsset[]
  accounts: AccountOption[]
  /** Accounts already linked to another author, so they can't be picked twice. */
  linkedUserIds: Set<string>
  onDone: () => void
}) {
  const router = useRouter()
  const [form, setForm] = useState<AuthorFormInput>(author ? toForm(author) : EMPTY)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const set = (patch: Partial<AuthorFormInput>) => setForm((f) => ({ ...f, ...patch }))
  const id = author?.id ?? 'new'

  const save = async () => {
    const parsed = AuthorFormSchema.safeParse({ ...form, slug: form.slug || slugify(form.name) })
    if (!parsed.success) return setErrors(parsed.error.issues.map(describeIssue))
    setErrors([])
    setSaving(true)
    try {
      const res = author
        ? await updateAuthorFn({ data: { id: author.id, data: parsed.data } })
        : await createAuthorFn({ data: parsed.data })
      if (!res.ok) return setErrors([res.message])
      await router.invalidate()
      onDone()
    } catch {
      setErrors(['Không lưu được tác giả. Hãy thử lại.'])
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {errors.length > 0 && (
        <ul role="alert" className="list-disc space-y-1 rounded-xl border border-destructive/40 bg-destructive/10 p-4 pl-8 text-sm text-destructive">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id={`${id}-name`}
          label="Họ tên *"
          value={form.name}
          onChange={(name) => set({ name, slug: author ? form.slug : slugify(name) })}
          placeholder="Linh Tran"
        />
        <TextField id={`${id}-role`} label="Chức danh (tiếng Anh)" value={form.role} onChange={(role) => set({ role })} placeholder="Solutions Engineer" />
        <div className="sm:col-span-2">
          <TextField
            id={`${id}-bio`}
            label="Giới thiệu ngắn (tiếng Anh) — kinh nghiệm, chuyên môn"
            value={form.bio}
            onChange={(bio) => set({ bio })}
            multiline
            hint={`${form.bio.length}/600 ký tự. Ví dụ: "Linh has deployed digital signage for 40+ retail stores since 2019."`}
          />
        </div>
        <TextField
          id={`${id}-profile`}
          label="Link hồ sơ (LinkedIn)"
          value={form.profileUrl}
          onChange={(profileUrl) => set({ profileUrl })}
          placeholder="https://www.linkedin.com/in/…"
        />
        <div>
          <Label htmlFor={`${id}-kind`} className="text-xs text-muted-foreground">
            Loại
          </Label>
          <select
            id={`${id}-kind`}
            value={form.kind}
            onChange={(e) => set({ kind: e.target.value === 'organization' ? 'organization' : 'person' })}
            className={selectClass}
          >
            <option value="person">Người viết (Person)</option>
            <option value="organization">Tổ chức / nhóm (Organization)</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={`${id}-user`} className="text-xs text-muted-foreground">
            Tài khoản admin liên kết
          </Label>
          <select
            id={`${id}-user`}
            value={form.userId ?? ''}
            onChange={(e) => set({ userId: e.target.value || null })}
            aria-describedby={`${id}-user-hint`}
            className={selectClass}
          >
            <option value="">Không liên kết (khách mời, nhóm…)</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id} disabled={linkedUserIds.has(a.id) && a.id !== author?.userId}>
                {a.name}
                {linkedUserIds.has(a.id) && a.id !== author?.userId ? ' (đã liên kết tác giả khác)' : ''}
              </option>
            ))}
          </select>
          <p id={`${id}-user-hint`} className="mt-1 text-[11px] text-muted-foreground">
            Bài blog mới do tài khoản này tạo sẽ tự chọn tác giả này. Mỗi tài khoản liên kết với tối đa một tác giả.
          </p>
        </div>
        <div className="flex items-center gap-3 sm:col-span-2">
          {form.avatarUrl ? (
            <img src={form.avatarUrl} alt="" className="size-14 rounded-full border border-border object-cover" />
          ) : (
            <span className="flex size-14 items-center justify-center rounded-full bg-muted/40">
              <ImageIcon aria-hidden="true" className="size-5 text-muted-foreground" />
            </span>
          )}
          <button type="button" onClick={() => setPickerOpen(true)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent">
            {form.avatarUrl ? 'Đổi ảnh' : 'Chọn ảnh chân dung'}
          </button>
          {form.avatarUrl && (
            <button type="button" onClick={() => set({ avatarUrl: '' })} className="text-xs text-destructive hover:underline">
              Bỏ ảnh
            </button>
          )}
          <span className="text-[11px] text-muted-foreground">Ảnh vuông, rõ mặt.</span>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onDone} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent">
          Huỷ
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving || !form.name.trim()}
          className="bg-brand-gradient rounded-lg px-4 py-2 text-sm font-semibold text-on-gradient hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Đang lưu…' : 'Lưu tác giả'}
        </button>
      </div>
      <ImagePickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        assets={assets}
        currentId={null}
        description="Chọn ảnh chân dung của tác giả."
        onPick={(asset) => set({ avatarUrl: asset.url })}
      />
    </div>
  )
}

/** Author profiles for blog bylines: real people with a role, a bio and a photo build trust (E-E-A-T). */
export function AuthorsEditor({
  authors,
  assets,
  accounts,
}: {
  authors: AuthorRow[]
  assets: LibraryAsset[]
  accounts: AccountOption[]
}) {
  const linkedUserIds = new Set(authors.flatMap((a) => (a.userId ? [a.userId] : [])))
  const accountName = (userId: string | null) => accounts.find((a) => a.id === userId)?.name
  const router = useRouter()
  // Which form is open: 'new', an author id, or none.
  const [editing, setEditing] = useState<string | null>(authors.length === 0 ? 'new' : null)
  const confirm = useConfirm()
  const toast = useToast()

  const remove = (a: AuthorRow) =>
    confirm({
      title: `Xoá tác giả "${a.name}"?`,
      description: 'Các bài của tác giả này giữ tên hiển thị nhưng mất liên kết tới hồ sơ.',
      confirmText: 'Xoá tác giả',
      tone: 'danger',
      onConfirm: async () => {
        const res = await deleteAuthorFn({ data: { id: a.id } })
        if (!res.ok) return 'Không xoá được tác giả. Hãy thử lại.'
        await router.invalidate()
        toast({ title: 'Đã xoá tác giả', description: a.name, tone: 'success' })
      },
    })

  return (
    <div className="space-y-6">
      {editing === 'new' ? (
        <Card>
          <CardHeader>
            <CardTitle>Thêm tác giả</CardTitle>
            <CardDescription>Chỉ thêm người đã đồng ý cho dùng tên, chức danh, ảnh và phần giới thiệu.</CardDescription>
          </CardHeader>
          <CardContent>
            <AuthorForm assets={assets} accounts={accounts} linkedUserIds={linkedUserIds} onDone={() => setEditing(null)} />
          </CardContent>
        </Card>
      ) : (
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="bg-brand-gradient inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-on-gradient hover:opacity-90"
        >
          <Plus aria-hidden="true" className="size-4" /> Thêm tác giả
        </button>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {authors.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <LazyImage src={a.avatarUrl || '/logo.png'} alt="" className="size-10 rounded-full border border-border object-cover" />
                <div className="min-w-0">
                  <CardTitle>{a.name}</CardTitle>
                  <CardDescription>{a.role || 'Chưa có chức danh'}</CardDescription>
                  {accountName(a.userId) && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Tài khoản: {accountName(a.userId)}</p>
                  )}
                </div>
              </div>
              <CardAction className="gap-1">
                <button
                  type="button"
                  onClick={() => setEditing(editing === a.id ? null : a.id)}
                  aria-label={`Sửa ${a.name}`}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Pencil aria-hidden="true" className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(a)}
                  aria-label={`Xoá ${a.name}`}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-3">
              {editing === a.id ? (
                <AuthorForm author={a} assets={assets} accounts={accounts} linkedUserIds={linkedUserIds} onDone={() => setEditing(null)} />
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <AnimatedBadge status={a.kind === 'person' ? 'info' : 'neutral'} size="sm">
                      {a.kind === 'person' ? 'Người viết' : 'Tổ chức'}
                    </AnimatedBadge>
                    {a.kind === 'person' && (!a.bio || !a.avatarUrl || !a.profileUrl) && (
                      <AnimatedBadge status="warning" size="sm">
                        Thiếu {[!a.bio && 'giới thiệu', !a.avatarUrl && 'ảnh', !a.profileUrl && 'LinkedIn'].filter(Boolean).join(', ')}
                      </AnimatedBadge>
                    )}
                  </div>
                  {a.bio && <p className="text-xs leading-relaxed text-muted-foreground">{a.bio}</p>}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
