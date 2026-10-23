import { useBlocker, useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { EditorHandle, SaveState } from '~/components/admin/admin-ui'

interface Binding {
  ref: (handle: EditorHandle | null) => void
  onDirtyChange: (dirty: boolean) => void
}

/**
 * One Save button for an admin module with several editors. Each editor is
 * bound by key; Save asks every editor with changes to save, then refreshes
 * the route data once. Also saves on ⌘S / Ctrl+S and asks before leaving
 * with unsaved changes.
 */
export function useSaveAll() {
  const router = useRouter()
  const handles = useRef(new Map<string, EditorHandle>())
  const bindings = useRef(new Map<string, Binding>())
  const [dirtyKeys, setDirtyKeys] = useState<ReadonlySet<string>>(() => new Set())
  const [state, setState] = useState<SaveState>({ kind: 'idle' })
  const isDirty = dirtyKeys.size > 0
  const saving = state.kind === 'saving'

  const setDirty = useCallback((key: string, dirty: boolean) => {
    setDirtyKeys((prev) => {
      if (prev.has(key) === dirty) return prev
      const next = new Set(prev)
      if (dirty) next.add(key)
      else next.delete(key)
      return next
    })
  }, [])

  // Cached per key so editors get stable callbacks and do not re-register every render.
  const bind = useCallback((key: string): Binding => {
    let binding = bindings.current.get(key)
    if (!binding) {
      binding = {
        ref: (handle) => {
          if (handle) handles.current.set(key, handle)
          else handles.current.delete(key)
        },
        onDirtyChange: (dirty) => setDirty(key, dirty),
      }
      bindings.current.set(key, binding)
    }
    return binding
  }, [setDirty])

  const save = useCallback(async () => {
    setState({ kind: 'saving' })
    const results = await Promise.all([...handles.current.values()].map((h) => h.save()))
    if (results.some((r) => r?.ok)) await router.invalidate()
    const errors = results.flatMap((r) => (r && !r.ok ? [r.error] : []))
    setState(errors.length ? { kind: 'error', message: [...new Set(errors)].join(' ') } : { kind: 'saved' })
  }, [router])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 's' || !(e.metaKey || e.ctrlKey)) return
      e.preventDefault()
      if (isDirty && !saving) void save()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isDirty, saving, save])

  useBlocker({
    shouldBlockFn: () => isDirty && !window.confirm('You have unsaved changes. Leave without saving?'),
    enableBeforeUnload: isDirty,
  })

  return { bind, save, state, isDirty, saving }
}

/**
 * Reports an editor's unsaved state to `useSaveAll`, and clears it when the
 * editor unmounts (e.g. moving to another page) so the header does not keep
 * asking to save changes that are gone.
 */
export function useReportDirty(dirty: boolean, onDirtyChange: ((dirty: boolean) => void) | undefined) {
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange])
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange])
}
