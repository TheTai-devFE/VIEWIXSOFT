import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check, Copy, KeyRound, ShieldAlert } from 'lucide-react'
import { buttonSecondary } from '~/components/admin/admin-ui'
import { AnimatedBadge } from '~/components/ui/animated-badge'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { useConfirm, useToast } from '~/components/ui/feedback'
import { FieldInput } from '~/components/ui/field-input'
import { StatefulButton } from '~/components/ui/stateful-button'
import type { ButtonState } from '~/components/ui/stateful-button'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { API_RATE_LIMIT_PER_MINUTE, API_SCOPE_LABELS, API_SCOPES, CreateApiKeySchema } from '~/lib/api-keys'
import type { ApiScope } from '~/lib/api-keys'
import { EASE_OUT } from '~/lib/ease'
import { SITE_URL } from '~/lib/seo/meta'
import { cn } from '~/lib/cn'
import { createApiKeyFn, revokeApiKeyFn } from '~/server/functions/api-keys'
import type { ApiKeyListRow } from '~/server/api-keys/repository'

const formatDate = (d: Date | string | null) => (d ? new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—')

/** Copies `text`; the icon turns into a check for a moment so the copy is visible where it happened. */
function CopyButton({ text, label, compact = false }: { text: string; label: string; compact?: boolean }) {
  const toast = useToast()
  const reduce = useReducedMotion()
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      toast({ title: 'Không sao chép được', description: 'Trình duyệt chặn clipboard; hãy bôi đen và Ctrl+C.', tone: 'error' })
    }
  }
  const icon = (
    <AnimatePresence initial={false} mode="popLayout">
      <motion.span
        key={copied ? 'done' : 'copy'}
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
        transition={{ duration: 0.15, ease: EASE_OUT }}
        className="inline-flex"
      >
        {copied ? <Check aria-hidden="true" className="size-4 text-success" /> : <Copy aria-hidden="true" className="size-4" />}
      </motion.span>
    </AnimatePresence>
  )
  if (compact) {
    return (
      <button
        type="button"
        onClick={copy}
        aria-label={label}
        title={label}
        className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        {icon}
        <span role="status" className="sr-only">
          {copied ? 'Đã sao chép' : ''}
        </span>
      </button>
    )
  }
  return (
    <button type="button" onClick={copy} className={buttonSecondary}>
      {icon} {copied ? 'Đã sao chép' : label}
    </button>
  )
}

/** Creating a key: name and permissions, then the key shown once. */
function CreateKey() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<ApiScope[]>(['schema:read', 'schema:write'])
  const [error, setError] = useState('')
  const [state, setState] = useState<ButtonState>('idle')
  const [created, setCreated] = useState<{ key: string; name: string } | null>(null)

  const toggle = (scope: ApiScope, on: boolean) => setScopes((cur) => (on ? [...cur, scope] : cur.filter((s) => s !== scope)))

  const create = async () => {
    const parsed = CreateApiKeySchema.safeParse({ name, scopes })
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Thông tin chưa hợp lệ.')
    setError('')
    setState('loading')
    try {
      const res = await createApiKeyFn({ data: parsed.data })
      if (!res.ok) {
        setState('error')
        return setError(res.message)
      }
      setCreated({ key: res.key, name: res.row.name })
      setName('')
      setState('success')
      setTimeout(() => setState('idle'), 1500)
      await router.invalidate()
    } catch {
      setState('error')
      setError('Không tạo được khóa. Hãy thử lại.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2" className="text-base">
          Tạo khóa API mới
        </CardTitle>
        <CardDescription>Mỗi tool hoặc mỗi người dùng một khóa riêng, để thu hồi từng khóa khi cần.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <FieldInput
          id="api-key-name"
          label="Tên khóa *"
          value={name}
          onChange={(v) => {
            setName(v)
            if (error) setError('')
          }}
          placeholder="Tool SEO của anh A"
          error={error && !name.trim() ? error : undefined}
          className="max-w-md"
        />
        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-medium text-foreground">Quyền</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {API_SCOPES.map((s) => (
              <div
                key={s}
                className={cn('rounded-xl border p-3 transition-colors', scopes.includes(s) ? 'border-signal-500/50 bg-signal-500/5' : 'border-border')}
              >
                <Checkbox
                  id={`scope-${s.replace(':', '-')}`}
                  checked={scopes.includes(s)}
                  onCheckedChange={(on) => toggle(s, on)}
                  label={API_SCOPE_LABELS[s].label}
                  description={`${API_SCOPE_LABELS[s].hint} (${s})`}
                />
              </div>
            ))}
          </div>
        </fieldset>
        {error && name.trim() && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <StatefulButton state={state} onClick={create} loadingText="Đang tạo" successText="Đã tạo">
          Tạo khóa API
        </StatefulButton>

        <AnimatePresence>
          {created && (
            <motion.div
              role="status"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="space-y-3 rounded-xl border border-success/40 bg-success/10 p-4"
            >
              <div className="flex items-start gap-2">
                <KeyRound aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Khóa "{created.name}" đã được tạo.</p>
                  <p className="text-xs text-foreground">
                    Sao chép và lưu vào nơi an toàn ngay. <strong>Khóa chỉ hiện một lần</strong>; đừng chụp màn hình hay dán vào chat. Mất khóa thì thu hồi
                    và tạo khóa mới.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background py-1.5 pr-1.5 pl-3">
                <code className="min-w-0 flex-1 overflow-x-auto font-mono text-xs break-all text-foreground">{created.key}</code>
                <CopyButton text={created.key} label="Sao chép khóa" compact />
              </div>
              <div className="flex flex-wrap gap-2">
                <CopyButton text={created.key} label="Sao chép khóa" />
                <button type="button" onClick={() => setCreated(null)} className={buttonSecondary}>
                  Đã lưu, ẩn khóa
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

function KeyList({ keys }: { keys: ApiKeyListRow[] }) {
  const router = useRouter()
  const confirm = useConfirm()
  const toast = useToast()
  const active = keys.filter((k) => !k.revokedAt).length

  const revoke = (k: ApiKeyListRow) =>
    confirm({
      title: `Thu hồi khóa "${k.name}"?`,
      description: 'Tool đang dùng khóa này sẽ bị từ chối ngay. Schema và bài nó đã gửi vẫn được giữ lại.',
      confirmText: 'Thu hồi',
      tone: 'danger',
      onConfirm: async () => {
        const res = await revokeApiKeyFn({ data: { id: k.id } })
        if (!res.ok) return res.message
        await router.invalidate()
        toast({ title: 'Đã thu hồi khóa', description: k.name, tone: 'success' })
      },
    })

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2" className="text-base">
          Khóa đã tạo
        </CardTitle>
        <CardDescription>Chỉ lưu mã băm của khóa: không ai xem lại được khóa đầy đủ. Không lưu IP của tool.</CardDescription>
        <CardAction>
          <AnimatedBadge status={active ? 'success' : 'neutral'} size="sm">
            {`${active} đang dùng`}
          </AnimatedBadge>
        </CardAction>
      </CardHeader>
      <CardContent>
        {keys.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Chưa có khóa nào.</p>
        ) : (
          <ul className="divide-y divide-border">
            {keys.map((k) => (
              <li key={k.id} className={cn('flex flex-wrap items-center gap-x-6 gap-y-3 py-4', k.revokedAt && 'opacity-60')}>
                <div className="min-w-40 flex-1">
                  <p className="font-medium text-foreground">{k.name}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <code className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-xs text-muted-foreground">{k.prefix}…</code>
                    <CopyButton text={k.prefix} label={`Sao chép mã nhận diện của khóa ${k.name}`} compact />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {k.scopes.map((s) => (
                    <AnimatedBadge key={s} status={s === 'blog:write' ? 'info' : 'neutral'} size="sm">
                      {API_SCOPE_LABELS[s as ApiScope]?.label ?? s}
                    </AnimatedBadge>
                  ))}
                </div>
                <dl className="grid grid-cols-2 gap-x-6 text-xs">
                  <dt className="text-muted-foreground">Đã tạo</dt>
                  <dt className="text-muted-foreground">Dùng gần nhất</dt>
                  <dd className="text-foreground tabular-nums">{formatDate(k.createdAt)}</dd>
                  <dd className="text-foreground tabular-nums">{formatDate(k.lastUsedAt)}</dd>
                </dl>
                <div className="ml-auto">
                  {k.revokedAt ? (
                    <AnimatedBadge status="neutral" size="sm">
                      Đã thu hồi
                    </AnimatedBadge>
                  ) : (
                    <button
                      type="button"
                      onClick={() => revoke(k)}
                      className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                    >
                      Thu hồi
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

const EXAMPLES = {
  schema: {
    label: 'Gửi schema',
    title: 'Gửi một FAQ dạng JSON-LD cho bài blog (quyền Ghi schema)',
    code: `curl -X POST ${SITE_URL}/api/v1/schemas \\
  -H "Authorization: Bearer vxs_…" \\
  -H "Content-Type: application/json" \\
  -d '{
    "path": "/blog/how-to-schedule-content",
    "name": "FAQ from AI writer",
    "jsonLd": {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [{
        "@type": "Question",
        "name": "How many screens can one account manage?",
        "acceptedAnswer": { "@type": "Answer", "text": "…" }
      }]
    }
  }'`,
  },
  post: {
    label: 'Gửi bài blog',
    title: 'Gửi một bài blog dạng HTML (quyền Gửi bài blog)',
    code: `curl -X POST ${SITE_URL}/api/v1/posts \\
  -H "Authorization: Bearer vxs_…" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "How to manage 100 digital signage screens remotely",
    "description": "A practical guide to grouping screens and scheduling playlists.",
    "format": "html",
    "content": "<p>Remote management lets you…</p><h2>What is it?</h2><p>…</p>",
    "product": "cms",
    "tags": ["remote management"]
  }'`,
  },
} as const

const ENDPOINTS: { method: string; path: string; scope: ApiScope; what: string }[] = [
  { method: 'GET', path: '/api/v1/schema-types', scope: 'schema:read', what: 'Các loại schema, ví dụ và JSON Schema của body' },
  { method: 'GET', path: '/api/v1/targets', scope: 'schema:read', what: 'Danh sách trang có thể gắn schema (path)' },
  { method: 'GET', path: '/api/v1/schemas?path=&status=', scope: 'schema:read', what: 'Danh sách schema, lọc theo trang và trạng thái' },
  { method: 'GET', path: '/api/v1/schemas/{id}', scope: 'schema:read', what: 'Một schema, kèm JSON-LD sẽ hiện trên trang' },
  { method: 'POST', path: '/api/v1/schemas', scope: 'schema:write', what: 'Tạo schema mới (luôn ở trạng thái chờ duyệt)' },
  { method: 'PUT', path: '/api/v1/schemas/{id}', scope: 'schema:write', what: 'Thay schema; quay về chờ duyệt' },
  { method: 'DELETE', path: '/api/v1/schemas/{id}', scope: 'schema:write', what: 'Xoá schema' },
  { method: 'GET', path: '/api/v1/posts/format', scope: 'blog:write', what: 'Các trường của bài, JSON Schema và ví dụ' },
  { method: 'POST', path: '/api/v1/posts', scope: 'blog:write', what: 'Gửi bài mới (luôn lưu Nháp), nội dung Markdown hoặc HTML' },
  { method: 'GET', path: '/api/v1/posts', scope: 'blog:write', what: 'Các bài đã gửi qua API' },
  { method: 'GET', path: '/api/v1/posts/{id}', scope: 'blog:write', what: 'Một bài đã gửi qua API' },
  { method: 'PUT', path: '/api/v1/posts/{id}', scope: 'blog:write', what: 'Sửa bài khi còn là Nháp' },
]

const METHOD_BADGE: Record<string, 'info' | 'success' | 'warning' | 'danger'> = { GET: 'info', POST: 'success', PUT: 'warning', DELETE: 'danger' }

/** How an outside tool calls the API; meant to be handed to whoever sets the tool up. */
function ApiGuide() {
  const [example, setExample] = useState<keyof typeof EXAMPLES>('post')
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2" className="text-base">
          Hướng dẫn cho tool bên ngoài
        </CardTitle>
        <CardDescription>Gửi phần này cùng khóa API cho người cài tool (bạn SEO, tool AI viết bài…).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ul className="list-disc space-y-1 pl-5 text-xs leading-relaxed text-muted-foreground">
          <li>
            Xác thực bằng header <code>Authorization: Bearer &lt;khóa&gt;</code>. Tối đa {API_RATE_LIMIT_PER_MINUTE} request mỗi phút cho mỗi khóa.
          </li>
          <li>Mọi schema gửi qua API đều ở trạng thái <strong>Chờ duyệt</strong>. Chỉ hiện trên site sau khi admin bấm Duyệt ở trang Schema markup.</li>
          <li>Tool chỉ sửa và xoá được schema do API tạo, không đụng được schema admin tự nhập.</li>
          <li>
            Bài gửi qua <code>/api/v1/posts</code> luôn lưu ở trạng thái <strong>Nháp</strong>, thuộc về người tạo khóa. Người trong mục Blog posts xem lại rồi
            bấm Đăng. Tool chỉ sửa được bài do API tạo và chỉ khi bài còn là Nháp.
          </li>
          <li>
            Schema nhận <code>"jsonLd"</code> (JSON-LD chuẩn schema.org) hoặc <code>"schema"</code> (<code>{'{ type, data }'}</code>). Thuộc tính bị bỏ qua
            được liệt kê trong <code>data.warnings</code>.
          </li>
          <li>Đây không phải REST API của WordPress. Tool cần hỗ trợ gọi API tuỳ chỉnh (custom API / webhook).</li>
        </ul>

        <ul className="divide-y divide-border rounded-xl border border-border">
          {ENDPOINTS.map((e) => (
            <li key={`${e.method} ${e.path}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-xs">
              <AnimatedBadge status={METHOD_BADGE[e.method] ?? 'neutral'} size="sm" className="w-16 justify-center font-mono">
                {e.method}
              </AnimatedBadge>
              <code className="font-mono text-foreground">{e.path}</code>
              <span className="text-muted-foreground">{e.what}</span>
              <code className="ml-auto font-mono text-[11px] text-muted-foreground">{e.scope}</code>
            </li>
          ))}
        </ul>

        <div className="space-y-2">
          <Tabs value={example} onValueChange={(v) => setExample(v === 'schema' ? 'schema' : 'post')}>
            <TabsList aria-label="Ví dụ">
              <TabsTrigger value="post">{EXAMPLES.post.label}</TabsTrigger>
              <TabsTrigger value="schema">{EXAMPLES.schema.label}</TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-xs font-medium text-muted-foreground">{EXAMPLES[example].title}</p>
          <div className="relative">
            <pre className="overflow-x-auto rounded-xl border border-border bg-muted/30 p-3 pr-12 font-mono text-[11px] leading-relaxed">{EXAMPLES[example].code}</pre>
            <div className="absolute top-2 right-2">
              <CopyButton text={EXAMPLES[example].code} label="Sao chép ví dụ" compact />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ApiKeysEditor({ keys }: { keys: ApiKeyListRow[] }) {
  return (
    <div className="space-y-6">
      <div className="flex gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs leading-relaxed text-foreground">
        <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
        <p>
          Khóa API có quyền ghi vào site. Chỉ gửi khóa qua kênh riêng tư cho đúng người cài tool, không chụp màn hình hay dán vào nhóm chat. Nghi lộ thì
          bấm <strong>Thu hồi</strong> và tạo khóa mới.
        </p>
      </div>
      <CreateKey />
      <KeyList keys={keys} />
      <ApiGuide />
    </div>
  )
}
