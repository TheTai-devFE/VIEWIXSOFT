import { useState } from 'react'
import type { LibraryAsset } from '~/components/admin/ImagePickerSheet'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { blankSchema, CUSTOM_SCHEMA_LABELS, CUSTOM_SCHEMA_TYPES } from '~/lib/seo/custom-schema'
import { JsonLdEditor } from './JsonLdEditor'
import { SchemaFields } from './SchemaFields'
import type { SchemaDraft } from './SchemaFields'

/**
 * The type picker and the schema's content, filled either by form or by
 * pasting JSON-LD; both edit the same draft. Shared by /admin/schema and the
 * blog post editor.
 */
export function SchemaInput({
  id,
  draft,
  onChange,
  path,
  assets,
  defaultMode = 'form',
}: {
  id: string
  draft: SchemaDraft
  onChange: (draft: SchemaDraft) => void
  /** The page the schema goes on; links in the JSON-LD point at it. */
  path: string
  assets: LibraryAsset[]
  defaultMode?: 'form' | 'json'
}) {
  const [mode, setMode] = useState(defaultMode)
  // Bumped when the type is picked by hand, so an open JSON editor restarts from the new type.
  const [editorKey, setEditorKey] = useState(0)

  const changeType = (value: string) => {
    const type = CUSTOM_SCHEMA_TYPES.find((t) => t === value)
    if (!type || type === draft.type) return
    onChange(blankSchema(type))
    setEditorKey((k) => k + 1)
  }

  return (
    <div className="space-y-5">
      <div className="max-w-sm">
        <Label htmlFor={`${id}-type`} className="text-xs text-muted-foreground">
          Loại schema *
        </Label>
        <Select id={`${id}-type`} value={draft.type} onValueChange={changeType} className="mt-1">
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CUSTOM_SCHEMA_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {CUSTOM_SCHEMA_LABELS[t].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-1 text-[11px] text-muted-foreground">{CUSTOM_SCHEMA_LABELS[draft.type].hint} Đổi loại sẽ xoá các ô đã nhập.</p>
      </div>
      {draft.type === 'Custom' ? (
        // The free-form type has its own label: value / JSON switch.
        <SchemaFields id={id} draft={draft} onChange={onChange} assets={assets} />
      ) : (
        <>
          <Tabs value={mode} onValueChange={(v) => setMode(v === 'json' ? 'json' : 'form')}>
            <TabsList aria-label="Cách nhập">
              <TabsTrigger value="form">Biểu mẫu</TabsTrigger>
              <TabsTrigger value="json">JSON-LD</TabsTrigger>
            </TabsList>
          </Tabs>
          {mode === 'form' ? (
            <SchemaFields id={id} draft={draft} onChange={onChange} assets={assets} />
          ) : (
            <JsonLdEditor key={editorKey} id={id} draft={draft} path={path} onChange={onChange} />
          )}
        </>
      )}
    </div>
  )
}
