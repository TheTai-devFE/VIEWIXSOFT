import { useImperativeHandle, useRef, useState } from 'react'
import type { Ref } from 'react'
import type { EditorHandle, SaveResult } from '~/components/admin/admin-ui'
import { useReportDirty } from '~/hooks/use-save-all'
import { SECTION_CONTENT } from '~/lib/section-content'
import type { SectionContentKey } from '~/lib/section-content'
import { saveSectionContentFn } from '~/server/functions/site-admin'

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/**
 * The draft behind a section content editor: the edited values, the section's
 * Zod schema as validator (issues keyed by path, e.g. "termPlans.0.price"),
 * and saving through the page header's Save via `ref`.
 */
export function useSectionDraft<T>({
  contentKey,
  name,
  initial,
  ref,
  onDirtyChange,
}: {
  contentKey: SectionContentKey
  /** The section's name in messages, e.g. "Pricing". */
  name: string
  initial: T
  ref?: Ref<EditorHandle>
  onDirtyChange?: (dirty: boolean) => void
}) {
  const { schema, defaults } = SECTION_CONTENT[contentKey]
  const [values, setValues] = useState<T>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [attempted, setAttempted] = useState(false)
  const latest = useRef(values)
  latest.current = values

  const dirty = !same(values, initial)
  useReportDirty(dirty, onDirtyChange)

  const validate = (next: unknown) => {
    const parsed = schema.safeParse(next)
    const found: Record<string, string> = {}
    if (!parsed.success) {
      for (const issue of parsed.error.issues) found[issue.path.join('.')] ??= issue.message
    }
    setErrors(found)
    return parsed
  }

  /** Replaces the draft; `fn` gets the latest values, so quick edits never overwrite each other. */
  const update = (fn: (current: T) => T) => {
    const next = fn(latest.current)
    latest.current = next
    setValues(next)
    // Errors follow the edits once a save has been tried, as in the other editors.
    if (attempted) validate(next)
  }

  useImperativeHandle(
    ref,
    () => ({
      save: async (): Promise<SaveResult | null> => {
        if (!dirty) return null
        setAttempted(true)
        const parsed = validate(latest.current)
        if (!parsed.success) return { ok: false, error: `Fix the highlighted fields in ${name}.` }
        try {
          // Content equal to the defaults is stored as "no override", so later code changes still show.
          const content = same(parsed.data, defaults) ? null : parsed.data
          const res = await saveSectionContentFn({ data: { key: contentKey, content } })
          return res.ok ? { ok: true } : { ok: false, error: res.error }
        } catch {
          return { ok: false, error: `${name} could not be saved. Check your connection.` }
        }
      },
    }),
    // validate only reads its argument and state setters.
    [dirty, contentKey, defaults, name, schema],
  )

  return {
    values,
    update,
    /** The first problem at a path, once a save has been tried. */
    errorAt: (path: string) => (attempted ? errors[path] : undefined),
    idFor: (path: string) => `${contentKey.replace(':', '-')}-${path.replace(/\./g, '-')}`,
  }
}
