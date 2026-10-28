import { useState } from 'react'
import { textareaClass } from '~/components/admin/use-cases/BlockFields'
import { Label } from '~/components/ui/label'
import { buildCustomJsonLd, CUSTOM_SCHEMA_LABELS, CustomSchemaInputSchema } from '~/lib/seo/custom-schema'
import { importJsonLd, jsonLdTemplate } from '~/lib/seo/custom-schema-import'
import { cn } from '~/lib/cn'
import { cleanDraft } from './SchemaFields'
import type { SchemaDraft } from './SchemaFields'

type Status = { kind: 'idle' } | { kind: 'error'; message: string } | { kind: 'ok'; ignored: string[]; switchedTo?: string }

/** The JSON-LD of what the form holds, or a skeleton of the type while it is too empty to build. */
function startingText(draft: SchemaDraft, path: string) {
  const parsed = CustomSchemaInputSchema.safeParse(cleanDraft(draft))
  const json = parsed.success ? buildCustomJsonLd(parsed.data, path || '/') : jsonLdTemplate(draft.type)
  return JSON.stringify(json, null, 2)
}

/**
 * Edits the schema as raw JSON-LD. Every valid edit is read back into the form
 * draft, so switching to the form tab shows the same content. Mount it fresh
 * when the tab opens: it starts from the draft at that moment.
 */
export function JsonLdEditor({ id, draft, path, onChange }: { id: string; draft: SchemaDraft; path: string; onChange: (draft: SchemaDraft) => void }) {
  const [value, setValue] = useState(() => startingText(draft, path))
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const onInput = (next: string) => {
    setValue(next)
    const result = importJsonLd(next)
    if (!result.ok) return setStatus({ kind: 'error', message: result.error })
    setStatus({
      kind: 'ok',
      ignored: result.ignored,
      switchedTo: result.draft.type !== draft.type ? CUSTOM_SCHEMA_LABELS[result.draft.type].label : undefined,
    })
    onChange(result.draft)
  }

  return (
    <div>
      <Label htmlFor={`${id}-jsonld`} className="text-xs text-muted-foreground">
        JSON-LD
      </Label>
      <textarea
        id={`${id}-jsonld`}
        value={value}
        onChange={(e) => onInput(e.target.value)}
        rows={18}
        spellCheck={false}
        aria-invalid={status.kind === 'error' ? true : undefined}
        aria-describedby={`${id}-jsonld-status`}
        className={cn(textareaClass, 'font-mono text-xs leading-relaxed', status.kind === 'error' && 'border-destructive')}
      />
      <div id={`${id}-jsonld-status`} role="status" className="mt-1 space-y-0.5 text-[11px]">
        {status.kind === 'error' && <p className="text-destructive">{status.message}</p>}
        {status.kind === 'ok' && status.switchedTo && <p className="text-signal-400">Đã chuyển loại schema sang {status.switchedTo} theo "@type".</p>}
        {status.kind === 'ok' && status.ignored.length > 0 && (
          <p className="text-warning">
            Loại này không giữ các thuộc tính: {status.ignored.join(', ')}. Muốn giữ nguyên toàn bộ, chọn loại "Mở rộng".
          </p>
        )}
        {status.kind !== 'error' && (
          <p className="text-muted-foreground">
            Dán JSON-LD từ ChatGPT, tool SEO hoặc trang khác; biểu mẫu tự điền theo. "@context" luôn là https://schema.org.
          </p>
        )}
      </div>
    </div>
  )
}
