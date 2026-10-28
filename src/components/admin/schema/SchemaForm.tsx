import { useMemo, useState } from 'react'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Copy, ExternalLink, TriangleAlert } from 'lucide-react'
import type { LibraryAsset } from '~/components/admin/ImagePickerSheet'
import { buttonPrimary, buttonSecondary } from '~/components/admin/admin-ui'
import { describeIssue } from '~/components/admin/use-cases/form-errors'
import { TextField } from '~/components/admin/use-cases/BlockFields'
import { AnimatedBadge } from '~/components/ui/animated-badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxTrigger,
} from '~/components/ui/combobox'
import { useToast } from '~/components/ui/feedback'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import {
  blankSchema,
  buildCustomJsonLd,
  CUSTOM_SCHEMA_STATUS_LABELS,
  CUSTOM_SCHEMA_STATUSES,
  CUSTOM_SCHEMA_TYPES,
  CustomSchemaFormSchema,
  REPLACES_BUILT_IN,
} from '~/lib/seo/custom-schema'
import type { CustomSchemaStatus } from '~/lib/seo/custom-schema'
import { SITE_URL } from '~/lib/seo/meta'
import { saveCustomSchemaFn } from '~/server/functions/custom-schemas'
import type { CustomSchemaRow } from '~/server/db/schema'
import type { SchemaTarget } from '~/server/custom-schemas/targets'
import { cleanDraft } from './SchemaFields'
import { SchemaInput } from './SchemaInput'
import type { SchemaDraft } from './SchemaFields'

const TARGET_GROUPS: { kind: SchemaTarget['kind']; label: string }[] = [
  { kind: 'page', label: 'Trang' },
  { kind: 'blog', label: 'Bài blog' },
  { kind: 'case-study', label: 'Case study' },
]

const STATUS_HINT: Record<CustomSchemaStatus, string> = {
  published: 'Hiện trên trang trong khoảng một phút sau khi lưu.',
  pending: 'Lưu lại nhưng chưa hiện trên trang, chờ duyệt.',
  disabled: 'Lưu lại nhưng không hiện trên trang.',
}

/** The form's starting draft for an existing row. */
function draftFrom(row: CustomSchemaRow): SchemaDraft {
  const type = CUSTOM_SCHEMA_TYPES.find((t) => t === row.schemaType) ?? 'Custom'
  return { type, data: row.data } as SchemaDraft
}

/** Create or edit one schema: page and type, the type's fields, and a live JSON-LD preview beside them. */
export function SchemaForm({
  row,
  targets,
  assets,
  initialPath,
}: {
  row?: CustomSchemaRow
  targets: SchemaTarget[]
  assets: LibraryAsset[]
  /** Preselected page for a new schema, e.g. from a link in the blog editor. */
  initialPath?: string
}) {
  const router = useRouter()
  const navigate = useNavigate()
  const toast = useToast()
  const [path, setPath] = useState(row?.path ?? initialPath ?? '')
  const [name, setName] = useState(row?.name ?? '')
  const [status, setStatus] = useState<CustomSchemaStatus>(row?.status ?? 'published')
  const [draft, setDraft] = useState<SchemaDraft>(row ? draftFrom(row) : blankSchema('FAQPage'))
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const id = row?.id ?? 'new'

  const parsed = useMemo(() => CustomSchemaFormSchema.safeParse({ path, name, schema: cleanDraft(draft) }), [path, name, draft])
  const preview = parsed.success ? JSON.stringify(buildCustomJsonLd(parsed.data.schema, parsed.data.path), null, 2) : null

  const save = async () => {
    if (!path) return setErrors(['Chọn trang để gắn schema.'])
    if (!parsed.success) return setErrors(parsed.error.issues.map(describeIssue))
    setErrors([])
    setSaving(true)
    try {
      const res = await saveCustomSchemaFn({ data: { id: row?.id, status, form: parsed.data } })
      if (!res.ok) return setErrors([res.message])
      toast({ title: row ? 'Đã lưu schema' : 'Đã thêm schema', description: STATUS_HINT[status], tone: 'success' })
      await router.invalidate()
      await navigate({ to: '/admin/schema' })
    } catch {
      setErrors(['Không lưu được schema. Hãy thử lại.'])
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/schema" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft aria-hidden="true" className="size-4" /> Danh sách schema
      </Link>

      {errors.length > 0 && (
        <ul role="alert" className="list-disc space-y-1 rounded-xl border border-destructive/40 bg-destructive/10 p-4 pl-8 text-sm text-destructive">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Gắn vào trang nào?</CardTitle>
              <CardDescription>Gõ để tìm theo tên trang, tiêu đề bài hoặc đường dẫn.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor={`${id}-path`} className="text-xs text-muted-foreground">
                  Trang *
                </Label>
                <Combobox id={`${id}-path`} value={path} onValueChange={setPath} className="mt-1">
                  <ComboboxTrigger>
                    <ComboboxInput placeholder="Tìm trang, bài blog, case study…" />
                  </ComboboxTrigger>
                  <ComboboxContent>
                    <ComboboxList aria-label="Trang">
                      <ComboboxEmpty>Không tìm thấy trang nào.</ComboboxEmpty>
                      {TARGET_GROUPS.map((g) => (
                        <ComboboxGroup key={g.kind}>
                          <ComboboxLabel>{g.label}</ComboboxLabel>
                          {targets
                            .filter((t) => t.kind === g.kind)
                            .map((t) => (
                              <ComboboxItem key={t.path} value={t.path} textValue={t.label} keywords={[t.path]}>
                                <span className="block truncate font-medium text-foreground">{t.label}</span>
                                <span className="block truncate font-mono text-[11px] text-muted-foreground">{t.path}</span>
                              </ComboboxItem>
                            ))}
                        </ComboboxGroup>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                {path && (
                  <a
                    href={`${SITE_URL}${path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-signal-400 hover:underline"
                  >
                    {path}
                    <ExternalLink aria-hidden="true" className="size-3" />
                  </a>
                )}
              </div>
              <TextField id={`${id}-name`} label="Tên gợi nhớ (chỉ hiện trong admin)" value={name} onChange={setName} placeholder="FAQ giá cho trang Pricing" />
              <div>
                <Label htmlFor={`${id}-status`} className="text-xs text-muted-foreground">
                  Trạng thái
                </Label>
                <Select id={`${id}-status`} value={status} onValueChange={(v) => setStatus(CUSTOM_SCHEMA_STATUSES.find((s) => s === v) ?? 'pending')} className="mt-1">
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CUSTOM_SCHEMA_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {CUSTOM_SCHEMA_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[11px] text-muted-foreground">{STATUS_HINT[status]}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Loại schema và nội dung</CardTitle>
              <CardDescription>Nhập bằng biểu mẫu, hoặc dán JSON-LD có sẵn ở tab JSON-LD.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <SchemaInput id={id} draft={draft} onChange={setDraft} path={path} assets={assets} />
            </CardContent>
          </Card>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Xem trước JSON-LD</CardTitle>
                <AnimatedBadge status={preview ? 'success' : 'warning'} size="sm">
                  {preview ? 'Hợp lệ' : 'Chưa đủ'}
                </AnimatedBadge>
              </div>
              <CardDescription>Đúng đoạn mã sẽ nằm trong trang.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {preview ? (
                <pre className="max-h-[50vh] overflow-auto rounded-xl border border-border bg-muted/30 p-3 font-mono text-[11px] leading-relaxed text-foreground">{preview}</pre>
              ) : (
                <p className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">Chọn trang và điền đủ các ô có dấu * để xem trước.</p>
              )}
              {preview && (
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(preview)
                    toast({ title: 'Đã sao chép JSON-LD', tone: 'success' })
                  }}
                  className={buttonSecondary}
                >
                  <Copy aria-hidden="true" className="size-4" /> Sao chép
                </button>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs leading-relaxed text-foreground">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
            <p>
              Google yêu cầu schema khớp với nội dung <strong>hiển thị trên trang</strong>; gắn HowTo, FAQ hay Recipe mà trang không có nội dung đó có thể bị
              phạt. Viết nội dung bằng tiếng Anh như phần còn lại của site.
              {REPLACES_BUILT_IN.includes(draft.type) && ' FAQ tuỳ chỉnh đang chạy sẽ thay thế FAQ tự sinh của trang.'}
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <Link to="/admin/schema" className={buttonSecondary}>
              Huỷ
            </Link>
            <button type="button" onClick={save} disabled={saving} className={buttonPrimary}>
              {saving ? 'Đang lưu…' : row ? 'Lưu thay đổi' : 'Thêm schema'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
