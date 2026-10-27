import { Label } from '~/components/ui/label'
import { selectClass } from '~/components/admin/admin-ui'
import { PERMISSION_LABELS, PERMISSION_PRESETS, PERMISSIONS } from '~/lib/permissions'
import type { Permission, Role } from '~/lib/permissions'

/** Role picker plus one tick per admin module. Admins get every module, so the ticks lock. */
export function AccessFields({
  id,
  role,
  permissions,
  onChange,
  roleLocked,
}: {
  id: string
  role: Role
  permissions: Permission[]
  onChange: (next: { role: Role; permissions: Permission[] }) => void
  /** True on your own account: you can't change your own role. */
  roleLocked?: boolean
}) {
  const isAdmin = role === 'admin'
  const toggle = (p: Permission, on: boolean) =>
    onChange({ role, permissions: on ? [...permissions, p] : permissions.filter((x) => x !== p) })

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`${id}-role`} className="text-xs text-muted-foreground">
          Vai trò
        </Label>
        <select
          id={`${id}-role`}
          value={role}
          disabled={roleLocked}
          aria-describedby={`${id}-role-hint`}
          onChange={(e) => onChange({ role: e.target.value === 'admin' ? 'admin' : 'user', permissions })}
          className={`${selectClass} mt-1 w-full disabled:opacity-60`}
        >
          <option value="user">Thành viên: chỉ dùng các mục được tích</option>
          <option value="admin">Quản trị viên: toàn quyền, quản lý tài khoản</option>
        </select>
        <p id={`${id}-role-hint`} className="mt-1 text-[11px] text-muted-foreground">
          {roleLocked ? 'Bạn không thể tự đổi vai trò của mình.' : 'Chỉ Quản trị viên mới tạo và phân quyền được tài khoản khác.'}
        </p>
      </div>

      <fieldset disabled={isAdmin} className="space-y-3">
        <legend className="text-xs text-muted-foreground">
          {isAdmin ? 'Quản trị viên dùng được mọi mục.' : 'Được dùng các mục'}
        </legend>
        <div className="flex flex-wrap items-center gap-2">
          {!isAdmin && (
            <div className="flex flex-wrap gap-2">
              {PERMISSION_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onChange({ role, permissions: preset.permissions })}
                  className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-accent"
                >
                  Chọn nhanh: {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => onChange({ role, permissions: [] })}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-accent"
              >
                Bỏ chọn hết
              </button>
            </div>
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {PERMISSIONS.map((p) => {
            const checked = isAdmin || permissions.includes(p)
            return (
              <label
                key={p}
                htmlFor={`${id}-perm-${p}`}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[:checked]:border-signal-500/50 has-[:checked]:bg-signal-500/5 has-[:disabled]:cursor-default"
              >
                <input
                  id={`${id}-perm-${p}`}
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => toggle(p, e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-signal-500"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">{PERMISSION_LABELS[p].label}</span>
                  <span className="block text-[11px] text-muted-foreground">{PERMISSION_LABELS[p].hint}</span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}
