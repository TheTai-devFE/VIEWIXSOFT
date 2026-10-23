import { useCallback, useLayoutEffect, useRef, useState } from 'react'

/** Where the keyboard last moved to: the row's id, stamped with the query it was placed under. */
type RowCursor = { id: string; query: string }

function indexOfCursor(rows: readonly { id: string }[], query: string, cursor: RowCursor | null) {
  if (cursor === null || cursor.query !== query) return -1
  return rows.findIndex((row) => row.id === cursor.id)
}

/**
 * The highlighted row of a list whose rows can change under it. Resolved during
 * render (not in an effect) so the roving tabIndex and the next key press agree
 * with what is on screen. The cursor holds an id, not a position, so a list that
 * swaps its rows can't hand Enter to a row the user never chose.
 */
export function useRowCursor(rows: readonly { id: string }[], query: string) {
  const [cursor, setCursor] = useState<RowCursor | null>(null)
  const latest = useRef({ rows, query })
  useLayoutEffect(() => {
    latest.current = { rows, query }
  })

  const cursorRow = indexOfCursor(rows, query, cursor)
  if (cursor !== null && cursorRow < 0) setCursor(null)

  const moveTo = useCallback(
    (id: string | null) => setCursor(id === null ? null : { id, query: latest.current.query }),
    [],
  )

  const moveActive = useCallback((direction: 1 | -1) => {
    const { rows: live, query: liveQuery } = latest.current
    const last = live.length - 1
    if (last < 0) return
    // Step inside the update so two keys landing in one batch move two rows.
    setCursor((current) => {
      const at = Math.max(indexOfCursor(live, liveQuery, current), 0)
      const row = live[Math.min(Math.max(at + direction, 0), last)]
      return row ? { id: row.id, query: liveQuery } : current
    })
  }, [])

  return { activeIndex: cursorRow < 0 ? 0 : cursorRow, moveTo, moveActive }
}
