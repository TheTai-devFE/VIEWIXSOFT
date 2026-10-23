import { ArrowDown, ArrowUp } from 'lucide-react'
import { useImperativeHandle, useState } from 'react'
import type { Ref } from 'react'
import { buttonSecondary, Panel } from '~/components/admin/admin-ui'
import type { EditorHandle } from '~/components/admin/admin-ui'
import { useReportDirty } from '~/hooks/use-save-all'
import { SECTION_PAGES } from '~/data/site-sections'
import type { SectionPage } from '~/data/site-sections'
import { cn } from '~/lib/cn'
import { saveSectionsFn } from '~/server/functions/site-admin'

interface Row {
  key: string
  label: string
  locked: boolean
  note?: string
  enabled: boolean
}

function initialRows(page: SectionPage, saved: { sectionKey: string; enabled: boolean; sortOrder: number }[]): Row[] {
  const byKey = new Map(saved.map((s) => [s.sectionKey, s]))
  return SECTION_PAGES[page].sections
    .map((def, index) => {
      const s = byKey.get(def.key)
      const locked = 'locked' in def && def.locked === true
      return {
        key: def.key,
        label: def.label,
        locked,
        note: 'note' in def ? def.note : undefined,
        enabled: locked || (s?.enabled ?? true),
        order: s?.sortOrder ?? index,
      }
    })
    .sort((a, b) => a.order - b.order)
    .map(({ order: _order, ...row }) => row)
}

const snapshot = (rows: Row[]) => rows.map((r) => `${r.key}:${r.enabled}`).join()

/**
 * Show, hide and reorder the sections of one page, and pick the one whose
 * details show next to the list. Saving is driven by the page header through `ref`.
 */
export function SectionsEditor({
  page,
  saved,
  notice,
  selected,
  onSelect,
  ref,
  onDirtyChange,
}: {
  page: SectionPage
  saved: { page: string; sectionKey: string; enabled: boolean; sortOrder: number }[]
  /** Shown above the list, e.g. which other pages share these sections. */
  notice?: string
  selected: string
  onSelect: (key: string) => void
  ref?: Ref<EditorHandle>
  onDirtyChange?: (dirty: boolean) => void
}) {
  const pageSaved = saved.filter((s) => s.page === page)
  const [rows, setRows] = useState(() => initialRows(page, pageSaved))
  // Recomputed from `saved`, which the router refreshes after a save.
  const dirty = snapshot(rows) !== snapshot(initialRows(page, pageSaved))

  useReportDirty(dirty, onDirtyChange)

  const move = (index: number, by: -1 | 1) => {
    setRows((current) => {
      const next = [...current]
      const [item] = next.splice(index, 1)
      if (item) next.splice(index + by, 0, item)
      return next
    })
  }

  useImperativeHandle(
    ref,
    () => ({
      save: async () => {
        if (!dirty) return null
        try {
          const res = await saveSectionsFn({
            data: { page, sections: rows.map((r, i) => ({ key: r.key, enabled: r.enabled, sortOrder: i })) },
          })
          return res.ok ? { ok: true } : { ok: false, error: res.error }
        } catch {
          return { ok: false, error: 'Sections could not be saved. Check your connection.' }
        }
      },
    }),
    [dirty, page, rows],
  )

  const listId = `sections-${page}`
  const shown = rows.filter((r) => r.enabled).length
  const arrowButton = cn(buttonSecondary, 'size-7 p-0')
  return (
    <Panel title="Sections" description={`${shown} of ${rows.length} shown`} className="p-4">
      {notice && <p className="mb-3 rounded-lg bg-ink-950 px-3 py-2 text-xs text-ink-400">{notice}</p>}
      <ol id={listId} className="space-y-0.5">
        {rows.map((row, i) => {
          const active = row.key === selected
          return (
            <li
              key={row.key}
              className={cn(
                'group flex items-center gap-2 rounded-lg py-1 pr-1 pl-2 transition-colors',
                active ? 'bg-ink-800' : 'hover:bg-ink-800/50',
              )}
            >
              <input
                type="checkbox"
                checked={row.enabled}
                disabled={row.locked}
                aria-label={row.locked ? `${row.label} is always shown` : `Show ${row.label}`}
                onChange={(e) =>
                  setRows((current) => current.map((r) => (r.key === row.key ? { ...r, enabled: e.target.checked } : r)))
                }
                className="size-4 shrink-0 accent-signal-500"
              />
              <button
                type="button"
                aria-current={active ? 'true' : undefined}
                onClick={() => onSelect(row.key)}
                className={cn(
                  'min-w-0 flex-1 truncate py-1 text-left text-sm',
                  active ? 'font-semibold text-ink-50' : 'text-ink-200',
                  !row.enabled && 'text-ink-500 line-through decoration-ink-600',
                )}
              >
                {row.label}
              </button>
              <div className={cn('flex shrink-0 gap-0.5', !active && 'opacity-60 group-hover:opacity-100')}>
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={`Move ${row.label} up`}
                  className={arrowButton}
                >
                  <ArrowUp aria-hidden="true" className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === rows.length - 1}
                  aria-label={`Move ${row.label} down`}
                  className={arrowButton}
                >
                  <ArrowDown aria-hidden="true" className="size-3.5" />
                </button>
              </div>
            </li>
          )
        })}
      </ol>
    </Panel>
  )
}
