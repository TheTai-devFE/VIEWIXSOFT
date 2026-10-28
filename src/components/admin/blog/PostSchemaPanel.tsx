import { useMemo, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Braces, Check, Code2, Library, Pencil, PowerOff, Trash2 } from 'lucide-react'
import type { LibraryAsset } from '~/components/admin/ImagePickerSheet'
import { buttonPrimary, buttonSecondary } from '~/components/admin/admin-ui'
import { cleanDraft } from '~/components/admin/schema/SchemaFields'
import type { SchemaDraft } from '~/components/admin/schema/SchemaFields'
import { SchemaInput } from '~/components/admin/schema/SchemaInput'
import { describeIssue } from '~/components/admin/use-cases/form-errors'
import { TextField } from '~/components/admin/use-cases/BlockFields'
import { AnimatedBadge } from '~/components/ui/animated-badge'
import type { AnimatedBadgeStatus } from '~/components/ui/animated-badge'
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
import { useConfirm, useToast } from '~/components/ui/feedback'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import {
  blankSchema,
  buildCustomJsonLd,
  CUSTOM_SCHEMA_LABELS,
  CUSTOM_SCHEMA_STATUS_LABELS,
  CUSTOM_SCHEMA_STATUSES,
  CUSTOM_SCHEMA_TYPES,
  CustomSchemaInputSchema,
} from '~/lib/seo/custom-schema'
import type { CustomSchemaStatus, CustomSchemaType } from '~/lib/seo/custom-schema'
import { SITE_URL } from '~/lib/seo/meta'
import type { CustomSchemaListRow } from '~/server/custom-schemas/repository'
import type { SchemaLibraryItem } from '~/server/custom-schemas/post-schemas'
import { deletePostSchemaFn, savePostSchemaFn, setPostSchemaStatusFn } from '~/server/functions/post-schemas'

const STATUS_BADGE: Record<CustomSchemaStatus, AnimatedBadgeStatus> = { pending: 'warning', published: 'success', disabled: 'neutral' }
const typeLabel = (type: string) => CUSTOM_SCHEMA_LABELS[type as CustomSchemaType]?.label ?? type

function apiExample(path: string) {
  return `curl -X POST ${SITE_URL}/api/v1/schemas \\
  -H "Authorization: Bearer vxs_…" \\
  -H "Content-Type: application/json" \\
  -d '{
    "path": "${path}",
    "jsonLd": { "@context": "https://schema.org", "@type": "HowTo", "name": "…", "step": [] }
  }'`
}

/** Adds or edits one schema of the post, inline. */
function PostSchemaForm({
  postId,
  path,
  row,
  template,
  assets,
  onDone,
}: {
  postId: string
  path: string
  row?: CustomSchemaListRow
  /** Another page's schema to start a new one from. */
  template?: SchemaLibraryItem
  assets: LibraryAsset[]
  onDone: () => void
}) {
  const router = useRouter()
  const toast = useToast()
  const source = row ?? template
  const [name, setName] = useState(source?.name ?? '')
  const [status, setStatus] = useState<CustomSchemaStatus>(row?.status ?? 'published')
  const [draft, setDraft] = useState<SchemaDraft>(() => {
    if (!source) return blankSchema('HowTo')
    const type = CUSTOM_SCHEMA_TYPES.find((t) => t === source.schemaType) ?? 'Custom'
    return { type, data: source.data } as SchemaDraft
  })
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const id = `post-schema-${row?.id ?? 'new'}`

  const parsed = useMemo(() => CustomSchemaInputSchema.safeParse(cleanDraft(draft)), [draft])
  const preview = parsed.success ? JSON.stringify(buildCustomJsonLd(parsed.data, path), null, 2) : null

  const save = async () => {
    if (!parsed.success) return setErrors(parsed.error.issues.map(describeIssue))
    setErrors([])
    setSaving(true)
    try {
      const res = await savePostSchemaFn({ data: { postId, id: row?.id, name, status, schema: parsed.data } })
      if (!res.ok) return setErrors([res.message])
      toast({ title: row ? 'Đã lưu schema' : 'Đã thêm schema cho bài', tone: 'success' })
      await router.invalidate()
      onDone()
    } catch {
      setErrors(['Không lưu được schema. Hãy thử lại.'])
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      {template && (
        <p className="text-xs text-muted-foreground">
          Bản sao của schema trên <code>{template.path}</code>. Chỉnh cho đúng nội dung bài rồi lưu; trang gốc không bị ảnh hưởng.
        </p>
      )}
      {errors.length > 0 && (
        <ul role="alert" className="list-disc space-y-1 rounded-xl border border-destructive/40 bg-destructive/10 p-3 pl-7 text-xs text-destructive">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id={`${id}-name`} label="Tên gợi nhớ (chỉ hiện trong admin)" value={name} onChange={setName} placeholder="HowTo các bước cài đặt" />
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
        </div>
      </div>

      {/* A new schema opens on JSON-LD: pasting from ChatGPT or an SEO tool is the usual way in. */}
      <SchemaInput id={id} draft={draft} onChange={setDraft} path={path} assets={assets} defaultMode={source ? 'form' : 'json'} />

      {draft.type === 'FAQPage' && (
        <p className="rounded-lg border border-warning/40 bg-warning/10 p-2.5 text-[11px] text-foreground">
          FAQ này sẽ thay schema của khung FAQ phía trên. Câu hỏi trong schema phải hiện trên bài, nên thường chỉ cần dùng khung FAQ của bài.
        </p>
      )}

      <details className="text-xs">
        <summary className="cursor-pointer font-medium text-muted-foreground">
          Xem trước JSON-LD{' '}
          <AnimatedBadge status={preview ? 'success' : 'warning'} size="sm" className="ml-1 align-middle">
            {preview ? 'Hợp lệ' : 'Chưa đủ'}
          </AnimatedBadge>
        </summary>
        {preview ? (
          <pre className="mt-2 max-h-72 overflow-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-[11px] leading-relaxed">{preview}</pre>
        ) : (
          <p className="mt-2 text-muted-foreground">Điền đủ các ô có dấu * để xem trước.</p>
        )}
      </details>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className={buttonSecondary}>
          Huỷ
        </button>
        <button type="button" onClick={save} disabled={saving} className={buttonPrimary}>
          {saving ? 'Đang lưu…' : row ? 'Lưu schema' : 'Thêm schema'}
        </button>
      </div>
    </div>
  )
}

/**
 * Schema markup for one blog post: pasted as JSON-LD or filled by form, or
 * sent by an outside tool through /api/v1 with the post's path.
 */
export function PostSchemaPanel({
  postId,
  slug,
  schemas,
  library,
  canEdit,
  assets,
}: {
  /** Unset for a post not saved yet: schemas attach to a saved post's path. */
  postId?: string
  slug: string
  schemas: CustomSchemaListRow[]
  /** Other pages' schemas to copy from. */
  library: SchemaLibraryItem[]
  canEdit: boolean
  assets: LibraryAsset[]
}) {
  const router = useRouter()
  const confirm = useConfirm()
  const toast = useToast()
  // What is open below the list: the library picker, a new schema (blank or copied), a schema id, or nothing.
  const [editing, setEditing] = useState<string | null>(null)
  const [copyFrom, setCopyFrom] = useState<SchemaLibraryItem | undefined>()
  const libraryTypes = CUSTOM_SCHEMA_TYPES.filter((t) => library.some((l) => l.schemaType === t))
  const close = () => {
    setEditing(null)
    setCopyFrom(undefined)
  }
  const path = `/blog/${slug}`

  const setStatus = async (row: CustomSchemaListRow, status: CustomSchemaStatus) => {
    if (!postId) return
    const res = await setPostSchemaStatusFn({ data: { postId, id: row.id, status } })
    if (!res.ok) return toast({ title: 'Không đổi được trạng thái', description: res.message, tone: 'error' })
    await router.invalidate()
    toast({ title: status === 'published' ? 'Schema đang chạy' : 'Đã tắt schema', tone: 'success' })
  }

  const remove = (row: CustomSchemaListRow) =>
    confirm({
      title: 'Xoá schema này?',
      description: `${typeLabel(row.schemaType)} của bài. Không khôi phục được.`,
      confirmText: 'Xoá schema',
      tone: 'danger',
      onConfirm: async () => {
        if (!postId) return
        const res = await deletePostSchemaFn({ data: { postId, id: row.id } })
        if (!res.ok) return res.message
        await router.invalidate()
        toast({ title: 'Đã xoá schema', tone: 'success' })
      },
    })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schema markup của bài</CardTitle>
        <CardDescription>
          Thêm HowTo, Product, Recipe… riêng cho bài này: dán JSON-LD (từ ChatGPT, tool SEO) hoặc nhập biểu mẫu. Schema đang chạy hiện trên trang
          trong khoảng một phút.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!postId ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">Lưu bài lần đầu để thêm schema.</p>
        ) : (
          <>
            {schemas.length === 0 && !editing && <p className="text-xs text-muted-foreground">Bài chưa có schema riêng.</p>}

            {schemas.map((row) =>
              editing === row.id ? (
                <PostSchemaForm key={row.id} postId={postId} path={path} row={row} assets={assets} onDone={close} />
              ) : (
                <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{row.name || typeLabel(row.schemaType)}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <AnimatedBadge status={STATUS_BADGE[row.status]} size="sm">
                        {CUSTOM_SCHEMA_STATUS_LABELS[row.status]}
                      </AnimatedBadge>
                      <AnimatedBadge status={row.source === 'api' ? 'info' : 'neutral'} size="sm">
                        {row.source === 'api' ? `API · ${row.apiKeyName ?? 'khóa đã xoá'}` : typeLabel(row.schemaType)}
                      </AnimatedBadge>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1">
                      {row.status === 'published' ? (
                        <button type="button" onClick={() => setStatus(row, 'disabled')} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-accent">
                          <PowerOff aria-hidden="true" className="size-3.5" /> Tắt
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setStatus(row, 'published')}
                          className="inline-flex items-center gap-1 rounded-lg border border-success/40 px-2.5 py-1 text-xs font-semibold text-success hover:bg-success/10"
                        >
                          <Check aria-hidden="true" className="size-3.5" /> Duyệt
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setEditing(row.id)}
                        aria-label={`Sửa ${row.name || typeLabel(row.schemaType)}`}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        <Pencil aria-hidden="true" className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(row)}
                        aria-label={`Xoá ${row.name || typeLabel(row.schemaType)}`}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
              ),
            )}

            {editing === 'new' && <PostSchemaForm key={copyFrom?.id ?? 'blank'} postId={postId} path={path} template={copyFrom} assets={assets} onDone={close} />}

            {editing === 'pick' && (
              <div className="space-y-3 rounded-xl border border-border p-4">
                {library.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Chưa có schema nào ở trang khác. Tạo ở mục Schema markup, hoặc thêm bằng JSON-LD.</p>
                ) : (
                  <div>
                    <Label htmlFor="post-schema-pick" className="text-xs text-muted-foreground">
                      Chọn schema có sẵn để sao chép sang bài này
                    </Label>
                    <Combobox
                      id="post-schema-pick"
                      onValueChange={(id) => {
                        setCopyFrom(library.find((l) => l.id === id))
                        setEditing('new')
                      }}
                      className="mt-1"
                    >
                      <ComboboxTrigger>
                        <ComboboxInput placeholder="Tìm theo tên, loại hoặc trang…" />
                      </ComboboxTrigger>
                      <ComboboxContent>
                        <ComboboxList aria-label="Schema có sẵn">
                          <ComboboxEmpty>Không tìm thấy schema nào.</ComboboxEmpty>
                          {libraryTypes.map((type) => (
                            <ComboboxGroup key={type}>
                              <ComboboxLabel>{typeLabel(type)}</ComboboxLabel>
                              {library
                                .filter((l) => l.schemaType === type)
                                .map((l) => (
                                  <ComboboxItem key={l.id} value={l.id} textValue={l.name || typeLabel(l.schemaType)} keywords={[l.path, l.schemaType]}>
                                    <span className="block truncate font-medium text-foreground">{l.name || typeLabel(l.schemaType)}</span>
                                    <span className="block truncate text-[11px] text-muted-foreground">
                                      <span className="font-mono">{l.path}</span> · {CUSTOM_SCHEMA_STATUS_LABELS[l.status]}
                                    </span>
                                  </ComboboxItem>
                                ))}
                            </ComboboxGroup>
                          ))}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </div>
                )}
                <button type="button" onClick={close} className={buttonSecondary}>
                  Huỷ
                </button>
              </div>
            )}

            {canEdit && editing !== 'new' && editing !== 'pick' && (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setEditing('pick')} className={buttonSecondary}>
                  <Library aria-hidden="true" className="size-4" /> Chọn từ schema có sẵn
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCopyFrom(undefined)
                    setEditing('new')
                  }}
                  className={buttonSecondary}
                >
                  <Braces aria-hidden="true" className="size-4" /> Thêm bằng JSON-LD
                </button>
              </div>
            )}

            <details className="rounded-xl border border-border px-4 py-3 text-xs">
              <summary className="flex cursor-pointer items-center gap-1.5 font-medium text-foreground">
                <Code2 aria-hidden="true" className="size-4" /> Gửi schema cho bài này qua API
              </summary>
              <div className="mt-3 space-y-2 text-muted-foreground">
                <p>
                  Tool bên ngoài gửi tới <code>POST /api/v1/schemas</code> với <code>"path": "{path}"</code>, bằng khóa tạo ở mục Khóa API (chỉ admin tạo
                  được). Schema gửi qua API nằm ở trạng thái Chờ duyệt trong danh sách trên cho đến khi được duyệt.
                </p>
                <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-[11px] leading-relaxed text-foreground">{apiExample(path)}</pre>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(apiExample(path))
                    toast({ title: 'Đã sao chép ví dụ', tone: 'success' })
                  }}
                  className={buttonSecondary}
                >
                  Sao chép ví dụ
                </button>
              </div>
            </details>
          </>
        )}
      </CardContent>
    </Card>
  )
}
