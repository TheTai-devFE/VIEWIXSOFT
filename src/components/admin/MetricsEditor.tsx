import { useRouter } from '@tanstack/react-router'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { buttonPrimary, buttonSecondary, firstError, Panel, SaveStatus } from '~/components/admin/admin-ui'
import type { SaveState } from '~/components/admin/admin-ui'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { METRIC_DEFS } from '~/data/site-sections'
import { MetricSchema } from '~/lib/admin-schemas'
import type { MetricInput } from '~/lib/admin-schemas'
import { deleteMetricFn, saveMetricFn } from '~/server/functions/site-admin'

interface SavedMetric {
  key: string
  value: number
  source: string
  asOf: string
}

/** The home stats strip shows only when all three figures are filled in. */
export function MetricsEditor({ saved }: { saved: SavedMetric[] }) {
  return (
    <Panel
      title="Home stats"
      description="Enter real figures only, with where each comes from and the date it was taken. The strip stays hidden until all three are set."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {METRIC_DEFS.map((def) => (
          <MetricForm key={def.key} metricKey={def.key} label={def.label} saved={saved.find((m) => m.key === def.key)} />
        ))}
      </div>
    </Panel>
  )
}

function MetricForm({ metricKey, label, saved }: { metricKey: string; label: string; saved?: SavedMetric }) {
  const router = useRouter()
  const [state, setState] = useState<SaveState>({ kind: 'idle' })
  const id = (f: string) => `metric-${metricKey}-${f}`

  const defaults: MetricInput = {
    key: metricKey,
    value: saved ? String(saved.value) : '',
    source: saved?.source ?? '',
    asOf: saved?.asOf ?? '',
  }
  const form = useForm({
    defaultValues: defaults,
    validationLogic: revalidateLogic({ mode: 'submit', modeAfterSubmission: 'change' }),
    validators: { onDynamic: MetricSchema },
    onSubmit: async ({ value }) => {
      setState({ kind: 'saving' })
      try {
        const res = await saveMetricFn({ data: value })
        if (!res.ok) return setState({ kind: 'error', message: res.error })
        setState({ kind: 'saved' })
        await router.invalidate()
      } catch {
        setState({ kind: 'error', message: 'Saving failed. Check your connection.' })
      }
    },
  })

  const fields = [
    { name: 'value', label: 'Value', type: 'number', hint: 'Whole number, e.g. 1200' },
    { name: 'source', label: 'Source', type: 'text', hint: 'e.g. Device registry export' },
    { name: 'asOf', label: 'As of', type: 'date', hint: '' },
  ] as const

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
      className="space-y-3 rounded-xl border border-ink-800 bg-ink-950 p-4"
    >
      <h3 className="text-sm font-semibold text-ink-50">{label}</h3>
      {fields.map((f) => (
        <form.Field key={f.name} name={f.name}>
          {(field) => {
            const error = form.state.submissionAttempts > 0 ? firstError(field.state.meta.errors) : undefined
            return (
              <div>
                <Label htmlFor={id(f.name)}>{f.label}</Label>
                <Input
                  id={id(f.name)}
                  type={f.type}
                  value={field.state.value}
                  placeholder={f.hint}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? id(`${f.name}-error`) : undefined}
                  className="mt-1.5 h-10 bg-ink-900 text-ink-50"
                />
                {error && (
                  <p id={id(`${f.name}-error`)} className="mt-1 text-xs text-destructive">
                    {error}
                  </p>
                )}
              </div>
            )
          }}
        </form.Field>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <button type="submit" disabled={isSubmitting} className={buttonPrimary}>
              Save
            </button>
          )}
        </form.Subscribe>
        {saved && (
          <button
            type="button"
            className={buttonSecondary}
            onClick={async () => {
              setState({ kind: 'saving' })
              const res = await deleteMetricFn({ data: { key: metricKey } })
              if (!res.ok) return setState({ kind: 'error', message: res.error })
              form.reset({ key: metricKey, value: '', source: '', asOf: '' })
              setState({ kind: 'saved' })
              await router.invalidate()
            }}
          >
            Clear
          </button>
        )}
      </div>
      <SaveStatus state={state} />
    </form>
  )
}
