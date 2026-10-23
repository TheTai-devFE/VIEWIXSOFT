import { revalidateLogic, useForm, useStore } from '@tanstack/react-form'
import { useId, useImperativeHandle, useRef, useState } from 'react'
import type { Ref } from 'react'
import { buttonSecondary, firstError } from '~/components/admin/admin-ui'
import type { EditorHandle, SaveResult } from '~/components/admin/admin-ui'
import { useReportDirty } from '~/hooks/use-save-all'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import type { AdminPage } from '~/data/admin-pages'
import type { PageContent, PageOverride } from '~/data/page-content'
import { PageOverrideSchema } from '~/lib/admin-schemas'
import type { PageOverrideInput } from '~/lib/admin-schemas'
import { cn } from '~/lib/cn'
import { buildTitle, DESCRIPTION_MAX, SITE_URL, TITLE_MAX } from '~/lib/seo/meta'
import { savePageOverrideFn } from '~/server/functions/site-admin'

type FieldName = Exclude<keyof PageOverrideInput, 'key'>

interface FieldDef {
  name: FieldName
  label: string
  /** Default text shown as the placeholder. */
  fallback: string | undefined
  multiline?: boolean
  max: number
  hint?: string
}

/**
 * One page's row in /admin/seo: its Google result preview, and the title and
 * description fields behind Edit. Empty fields keep the default from the code.
 * Saving is driven by the module header through `ref`.
 */
export function SeoSnippetEditor({
  page,
  defaults,
  saved,
  ref,
  onDirtyChange,
}: {
  page: AdminPage
  defaults: PageContent
  saved: PageOverride | undefined
  ref?: Ref<EditorHandle>
  onDirtyChange?: (dirty: boolean) => void
}) {
  const result = useRef<SaveResult | null>(null)
  const [open, setOpen] = useState(false)
  const formId = useId()

  const initial: PageOverrideInput = {
    key: page.key,
    seoTitle: saved?.seoTitle ?? '',
    seoDescription: saved?.seoDescription ?? '',
  }

  const form = useForm({
    defaultValues: initial,
    validationLogic: revalidateLogic({ mode: 'submit', modeAfterSubmission: 'change' }),
    validators: { onDynamic: PageOverrideSchema },
    onSubmit: async ({ value }) => {
      try {
        const res = await savePageOverrideFn({ data: value })
        result.current = res.ok ? { ok: true } : { ok: false, error: res.error }
      } catch {
        result.current = { ok: false, error: 'The search snippet could not be saved. Try again.' }
      }
    },
  })

  const values = useStore(form.store, (s) => s.values)
  const effective = (name: FieldName, fallback: string | undefined) => {
    const v = values[name]?.trim()
    return v ? v : (fallback ?? '')
  }
  const previewTitle = buildTitle(effective('seoTitle', defaults.seo.title))
  const previewDescription = effective('seoDescription', defaults.seo.description)
  // Compared trimmed, as the server stores it, so trailing spaces are not a change.
  const dirty =
    (values.seoTitle ?? '').trim() !== initial.seoTitle || (values.seoDescription ?? '').trim() !== initial.seoDescription
  const hasCustom = Boolean(values.seoTitle?.trim() || values.seoDescription?.trim())

  useReportDirty(dirty, onDirtyChange)

  useImperativeHandle(
    ref,
    () => ({
      save: async () => {
        if (!dirty) return null
        result.current = null
        await form.handleSubmit()
        // onSubmit does not run when validation fails, so no result means invalid fields.
        if (!result.current) setOpen(true)
        return result.current ?? { ok: false, error: 'Fix the highlighted fields.' }
      },
    }),
    [dirty, form],
  )

  const seoFields: FieldDef[] = [
    {
      name: 'seoTitle',
      label: 'Title in Google',
      fallback: defaults.seo.title,
      max: 120,
      hint: `" — Viewixsoft" is added unless the title already names the brand. ${TITLE_MAX} characters at most in total.`,
    },
    { name: 'seoDescription', label: 'Description in Google', fallback: defaults.seo.description, multiline: true, max: DESCRIPTION_MAX },
  ]

  const renderField = (f: FieldDef) => (
    <form.Field key={f.name} name={f.name}>
      {(field) => {
        const error = form.state.submissionAttempts > 0 ? firstError(field.state.meta.errors) : undefined
        const id = `page-${page.key}-${f.name}`
        const value = field.state.value ?? ''
        const overridden = value.trim() !== ''
        const length = f.name === 'seoTitle' ? previewTitle.length : (overridden ? value.trim() : (f.fallback ?? '')).length
        const limit = f.name === 'seoTitle' ? TITLE_MAX : f.max
        const describedBy = [error && `${id}-error`, f.hint && `${id}-hint`].filter(Boolean).join(' ') || undefined
        const common = {
          id,
          value,
          placeholder: f.fallback ?? '',
          onBlur: field.handleBlur,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': describedBy,
        }
        return (
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor={id}>
                {f.label}{' '}
                {overridden ? (
                  <span className="ml-1 rounded-full bg-signal-950 px-1.5 py-0.5 font-mono text-[10px] text-signal-400">Custom</span>
                ) : (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">(default)</span>
                )}
              </Label>
              <span className={cn('font-mono text-[11px]', length > limit ? 'text-destructive' : 'text-muted-foreground')}>
                {length}/{limit}
              </span>
            </div>
            {f.multiline ? (
              <textarea
                {...common}
                rows={3}
                onChange={(e) => field.handleChange(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground/70"
              />
            ) : (
              <Input {...common} onChange={(e) => field.handleChange(e.target.value)} className="mt-1.5 h-10 bg-background" />
            )}
            {f.hint && (
              <p id={`${id}-hint`} className="mt-1 text-xs text-muted-foreground">
                {f.hint}
              </p>
            )}
            {error && (
              <p id={`${id}-error`} className="mt-1 text-xs text-destructive">
                {error}
              </p>
            )}
          </div>
        )
      }}
    </form.Field>
  )

  const isCustom = Boolean(initial.seoTitle || initial.seoDescription)
  return (
    <li className="px-5 py-4">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="font-medium text-foreground">{page.label}</span>
            <span className="font-mono text-xs text-muted-foreground">{page.path}</span>
            {dirty ? (
              <span className="rounded-full bg-warning/15 px-1.5 py-0.5 font-mono text-[10px] text-warning">Unsaved</span>
            ) : (
              isCustom && <span className="rounded-full bg-signal-950 px-1.5 py-0.5 font-mono text-[10px] text-signal-400">Custom</span>
            )}
          </div>
          <div aria-label={`Google result preview for ${page.label}`}>
            <p className="mt-1.5 truncate text-xs text-muted-foreground">
              {SITE_URL.replace('https://', '')}
              {page.path === '/' ? '' : page.path.replace(/\//g, ' › ')}
            </p>
            <p className="truncate text-base text-signal-500">{previewTitle}</p>
            <p className="line-clamp-2 text-sm text-muted-foreground">{previewDescription}</p>
          </div>
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={formId}
          onClick={() => setOpen((o) => !o)}
          className={cn(buttonSecondary, 'shrink-0')}
        >
          {open ? 'Close' : 'Edit'}
          <span className="sr-only"> {page.label}</span>
        </button>
      </div>

      {/* Kept mounted while closed so edits survive closing the row until Save. */}
      <form id={formId} hidden={!open} noValidate onSubmit={(e) => e.preventDefault()} className="mt-4 space-y-4">
        {seoFields.map(renderField)}
        {hasCustom && (
          <button
            type="button"
            onClick={() => {
              form.setFieldValue('seoTitle', '')
              form.setFieldValue('seoDescription', '')
            }}
            className="text-sm font-medium text-signal-400 underline-offset-2 hover:underline"
          >
            Use the default title and description
          </button>
        )}
      </form>
    </li>
  )
}
