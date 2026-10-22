import { useRouter } from '@tanstack/react-router'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { useState } from 'react'
import { buttonPrimary, buttonSecondary, Panel, SaveStatus } from '~/components/admin/admin-ui'
import type { SaveState } from '~/components/admin/admin-ui'
import { SECTION_PAGES } from '~/data/site-sections'
import type { SectionPage } from '~/data/site-sections'
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

/** Show, hide and reorder the sections of one page. */
export function SectionsEditor({
  page,
  saved,
}: {
  page: SectionPage
  saved: { page: string; sectionKey: string; enabled: boolean; sortOrder: number }[]
}) {
  const router = useRouter()
  const [rows, setRows] = useState(() => initialRows(page, saved.filter((s) => s.page === page)))
  const [state, setState] = useState<SaveState>({ kind: 'idle' })

  const move = (index: number, by: -1 | 1) => {
    setRows((current) => {
      const next = [...current]
      const [item] = next.splice(index, 1)
      if (item) next.splice(index + by, 0, item)
      return next
    })
  }

  const save = async () => {
    setState({ kind: 'saving' })
    try {
      const res = await saveSectionsFn({
        data: { page, sections: rows.map((r, i) => ({ key: r.key, enabled: r.enabled, sortOrder: i })) },
      })
      if (!res.ok) return setState({ kind: 'error', message: res.error })
      setState({ kind: 'saved' })
      await router.invalidate()
    } catch {
      setState({ kind: 'error', message: 'Saving failed. Check your connection.' })
    }
  }

  const listId = `sections-${page}`
  return (
    <Panel title={SECTION_PAGES[page].label} description="Untick to hide a section; use the arrows to reorder.">
      <ol id={listId} className="divide-y divide-ink-800 rounded-xl border border-ink-800">
        {rows.map((row, i) => (
          <li key={row.key} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <input
              id={`${listId}-${row.key}`}
              type="checkbox"
              checked={row.enabled}
              disabled={row.locked}
              onChange={(e) =>
                setRows((current) => current.map((r) => (r.key === row.key ? { ...r, enabled: e.target.checked } : r)))
              }
              className="size-4 accent-signal-500"
            />
            <label htmlFor={`${listId}-${row.key}`} className="min-w-0 flex-1 text-sm">
              <span className="font-medium text-ink-50">{row.label}</span>
              {row.locked && <span className="ml-2 text-xs text-ink-500">(always shown)</span>}
              {row.note && <span className="block text-xs text-ink-500">{row.note}</span>}
            </label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={`Move ${row.label} up`}
                className={buttonSecondary}
              >
                <ArrowUp aria-hidden="true" className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === rows.length - 1}
                aria-label={`Move ${row.label} down`}
                className={buttonSecondary}
              >
                <ArrowDown aria-hidden="true" className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button type="button" onClick={save} disabled={state.kind === 'saving'} className={buttonPrimary}>
          Save {SECTION_PAGES[page].label}
        </button>
        <SaveStatus state={state} />
      </div>
    </Panel>
  )
}
