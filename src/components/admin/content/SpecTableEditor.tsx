import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import type { Ref } from 'react'
import { buttonSecondary } from '~/components/admin/admin-ui'
import type { EditorHandle } from '~/components/admin/admin-ui'
import { ContentField } from '~/components/admin/content/ContentField'
import { useSectionDraft } from '~/components/admin/content/use-section-draft'
import { cn } from '~/lib/cn'
import type { SpecTable } from '~/lib/section-content'

const KEY = 'product-cms:spec-table'
const MAX_GROUPS = 8
const MAX_ROWS = 12
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`

type Group = SpecTable['groups'][number]
type Row = Group['items'][number]

function moved<T>(list: T[], from: number, to: number) {
  const next = [...list]
  const [item] = next.splice(from, 1)
  if (item) next.splice(to, 0, item)
  return next
}

/**
 * The Viewixsoft CMS specification table: groups (cards) of label–value rows.
 * Also published in the page's Markdown twin and llms-full.txt.
 */
export function SpecTableEditor({
  initial,
  ref,
  onDirtyChange,
}: {
  initial: SpecTable
  ref?: Ref<EditorHandle>
  onDirtyChange?: (dirty: boolean) => void
}) {
  const { values, update, errorAt, idFor } = useSectionDraft({
    contentKey: KEY,
    name: 'Specification table',
    initial,
    ref,
    onDirtyChange,
  })
  const arrowButton = cn(buttonSecondary, 'size-7 p-0')

  const setGroups = (fn: (groups: Group[]) => Group[]) => update((v) => ({ ...v, groups: fn(v.groups) }))
  const setGroup = (gi: number, patch: Partial<Group>) =>
    setGroups((groups) => groups.map((g, i) => (i === gi ? { ...g, ...patch } : g)))
  const setRows = (gi: number, fn: (rows: Row[]) => Row[]) =>
    setGroups((groups) => groups.map((g, i) => (i === gi ? { ...g, items: fn(g.items) } : g)))

  return (
    // Enter in a field saves through the header button's handler, not a second path.
    <form noValidate onSubmit={(e) => e.preventDefault()} className="space-y-4">
      <p className="rounded-lg bg-ink-950 px-3 py-2 text-xs text-ink-400">
        Each group is one card on the page. The table is also published in the page&apos;s Markdown version and in
        the summary for AI assistants. Only list facts the product team has confirmed.
      </p>

      <ol className="space-y-4">
        {values.groups.map((group, gi) => {
          const groupLabel = group.category || `group ${gi + 1}`
          return (
            <li key={group.id} className="rounded-xl border border-ink-800 p-4">
              <div className="flex items-start gap-3">
                <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                  <ContentField
                    id={idFor(`groups.${gi}.category`)}
                    label="Group name"
                    value={group.category}
                    onChange={(category) => setGroup(gi, { category })}
                    onBlur={() => undefined}
                    error={errorAt(`groups.${gi}.category`)}
                  />
                  <ContentField
                    id={idFor(`groups.${gi}.note`)}
                    label="Note"
                    hint="Small text under the group name. Leave empty to hide it."
                    value={group.note}
                    onChange={(note) => setGroup(gi, { note })}
                    onBlur={() => undefined}
                    error={errorAt(`groups.${gi}.note`)}
                  />
                </div>
                <div className="mt-6 flex shrink-0 gap-0.5">
                  <button
                    type="button"
                    onClick={() => setGroups((groups) => moved(groups, gi, gi - 1))}
                    disabled={gi === 0}
                    aria-label={`Move ${groupLabel} up`}
                    className={arrowButton}
                  >
                    <ArrowUp aria-hidden="true" className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroups((groups) => moved(groups, gi, gi + 1))}
                    disabled={gi === values.groups.length - 1}
                    aria-label={`Move ${groupLabel} down`}
                    className={arrowButton}
                  >
                    <ArrowDown aria-hidden="true" className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroups((groups) => groups.filter((_, i) => i !== gi))}
                    aria-label={`Remove ${groupLabel}`}
                    className={cn(arrowButton, 'hover:text-destructive')}
                  >
                    <Trash2 aria-hidden="true" className="size-3.5" />
                  </button>
                </div>
              </div>

              <ol className="mt-4 divide-y divide-ink-800 rounded-lg border border-ink-800">
                {group.items.map((row, ri) => {
                  const rowLabel = `${row.label || `row ${ri + 1}`} in ${groupLabel}`
                  return (
                    <li key={row.id} className="flex items-start gap-3 px-3 py-2.5">
                      <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                        <ContentField
                          id={idFor(`groups.${gi}.items.${ri}.label`)}
                          label={`Label, row ${ri + 1}`}
                          srOnlyLabel
                          value={row.label}
                          onChange={(label) => setRows(gi, (rows) => rows.map((r, i) => (i === ri ? { ...r, label } : r)))}
                          onBlur={() => undefined}
                          error={errorAt(`groups.${gi}.items.${ri}.label`)}
                        />
                        <ContentField
                          id={idFor(`groups.${gi}.items.${ri}.value`)}
                          label={`Value, row ${ri + 1}`}
                          srOnlyLabel
                          value={row.value}
                          onChange={(value) => setRows(gi, (rows) => rows.map((r, i) => (i === ri ? { ...r, value } : r)))}
                          onBlur={() => undefined}
                          error={errorAt(`groups.${gi}.items.${ri}.value`)}
                        />
                      </div>
                      <div className="mt-1 flex shrink-0 gap-0.5">
                        <button
                          type="button"
                          onClick={() => setRows(gi, (rows) => moved(rows, ri, ri - 1))}
                          disabled={ri === 0}
                          aria-label={`Move ${rowLabel} up`}
                          className={arrowButton}
                        >
                          <ArrowUp aria-hidden="true" className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRows(gi, (rows) => moved(rows, ri, ri + 1))}
                          disabled={ri === group.items.length - 1}
                          aria-label={`Move ${rowLabel} down`}
                          className={arrowButton}
                        >
                          <ArrowDown aria-hidden="true" className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRows(gi, (rows) => rows.filter((_, i) => i !== ri))}
                          aria-label={`Remove ${rowLabel}`}
                          className={cn(arrowButton, 'hover:text-destructive')}
                        >
                          <Trash2 aria-hidden="true" className="size-3.5" />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ol>
              {errorAt(`groups.${gi}.items`) && (
                <p className="mt-2 text-xs text-destructive">{errorAt(`groups.${gi}.items`)}</p>
              )}
              <button
                type="button"
                disabled={group.items.length >= MAX_ROWS}
                onClick={() => setRows(gi, (rows) => [...rows, { id: newId('row'), label: '', value: '' }])}
                className={cn(buttonSecondary, 'mt-3 h-8 text-xs')}
              >
                <Plus aria-hidden="true" className="size-3.5" />
                Add row
                <span className="sr-only"> to {groupLabel}</span>
              </button>
            </li>
          )
        })}
      </ol>
      {errorAt('groups') && <p className="text-xs text-destructive">{errorAt('groups')}</p>}

      <button
        type="button"
        disabled={values.groups.length >= MAX_GROUPS}
        onClick={() =>
          setGroups((groups) => [
            ...groups,
            { id: newId('group'), category: '', note: '', items: [{ id: newId('row'), label: '', value: '' }] },
          ])
        }
        className={buttonSecondary}
      >
        <Plus aria-hidden="true" className="size-4" />
        Add group
      </button>
    </form>
  )
}
