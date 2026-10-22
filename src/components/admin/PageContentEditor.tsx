import { useRouter } from '@tanstack/react-router'
import { revalidateLogic, useForm, useStore } from '@tanstack/react-form'
import { useState } from 'react'
import { buttonPrimary, buttonSecondary, firstError, Panel, SaveStatus } from '~/components/admin/admin-ui'
import type { SaveState } from '~/components/admin/admin-ui'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import type { AdminPage } from '~/data/admin-pages'
import type { PageContent, PageOverride } from '~/data/page-content'
import { PageOverrideSchema } from '~/lib/admin-schemas'
import type { PageOverrideInput } from '~/lib/admin-schemas'
import { cn } from '~/lib/cn'
import { buildTitle, DESCRIPTION_MAX, SITE_URL, TITLE_MAX } from '~/lib/seo/meta'
import { resetPageOverrideFn, savePageOverrideFn } from '~/server/functions/site-admin'

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

/** Edits one page's hero text and search snippet. Empty fields keep the default from the code. */
export function PageContentEditor({
  page,
  defaults,
  saved,
}: {
  page: AdminPage
  defaults: PageContent
  saved: PageOverride | undefined
}) {
  const router = useRouter()
  const [state, setState] = useState<SaveState>({ kind: 'idle' })
  const showEyebrow = page.hero?.eyebrow !== false
  const highlightLabel = page.hero?.highlight === false ? null : (page.hero?.highlight ?? 'Highlighted part (gradient)')

  const initial: PageOverrideInput = {
    key: page.key,
    heroEyebrow: saved?.heroEyebrow ?? '',
    heroTitle: saved?.heroTitle ?? '',
    heroHighlight: saved?.heroHighlight ?? '',
    heroDescription: saved?.heroDescription ?? '',
    seoTitle: saved?.seoTitle ?? '',
    seoDescription: saved?.seoDescription ?? '',
  }

  const form = useForm({
    defaultValues: initial,
    validationLogic: revalidateLogic({ mode: 'submit', modeAfterSubmission: 'change' }),
    validators: { onDynamic: PageOverrideSchema },
    onSubmit: async ({ value }) => {
      setState({ kind: 'saving' })
      try {
        const res = await savePageOverrideFn({ data: value })
        if (!res.ok) return setState({ kind: 'error', message: res.error })
        setState({ kind: 'saved' })
        await router.invalidate()
      } catch {
        setState({ kind: 'error', message: 'Saving failed. Check the highlighted fields and try again.' })
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
  const customized = Object.entries(initial).some(([k, v]) => k !== 'key' && v !== '')

  const heroFields: FieldDef[] = [
    ...(showEyebrow ? [{ name: 'heroEyebrow' as const, label: 'Eyebrow (small label above the heading)', fallback: defaults.hero.eyebrow, max: 40 }] : []),
    { name: 'heroTitle', label: 'Heading', fallback: defaults.hero.title, max: 120 },
    ...(highlightLabel ? [{ name: 'heroHighlight' as const, label: highlightLabel, fallback: defaults.hero.highlight, max: 80 }] : []),
    { name: 'heroDescription', label: 'Intro text', fallback: defaults.hero.description, multiline: true, max: 400 },
  ]
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

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
      className="space-y-6"
    >
      <Panel title="Hero" description="The heading area at the top of the page. Leave a field empty to keep the default shown in grey.">
        <div className="space-y-5">{heroFields.map(renderField)}</div>
      </Panel>

      <Panel title="Search appearance" description="How the page shows up in Google and when it is shared.">
        <div className="space-y-5">{seoFields.map(renderField)}</div>
        <div className="mt-6 rounded-xl border border-border bg-background p-4" aria-label="Google result preview">
          <p className="text-xs text-muted-foreground">Preview</p>
          <p className="mt-2 truncate text-xs text-muted-foreground">
            {SITE_URL.replace('https://', '')}
            {page.path === '/' ? '' : page.path.replace(/\//g, ' › ')}
          </p>
          <p className="mt-0.5 truncate text-lg text-signal-500">{previewTitle}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{previewDescription}</p>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center gap-3">
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <button type="submit" disabled={isSubmitting} className={buttonPrimary}>
              Save changes
            </button>
          )}
        </form.Subscribe>
        {customized && (
          <button
            type="button"
            className={buttonSecondary}
            onClick={async () => {
              if (!window.confirm('Remove every custom text on this page and go back to the defaults?')) return
              setState({ kind: 'saving' })
              const res = await resetPageOverrideFn({ data: { key: page.key } })
              if (!res.ok) return setState({ kind: 'error', message: res.error })
              form.reset({ ...initial, heroEyebrow: '', heroTitle: '', heroHighlight: '', heroDescription: '', seoTitle: '', seoDescription: '' })
              setState({ kind: 'saved' })
              await router.invalidate()
            }}
          >
            Reset to defaults
          </button>
        )}
        <SaveStatus state={state} />
      </div>
    </form>
  )
}
