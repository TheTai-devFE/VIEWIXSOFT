import type { ReactNode } from 'react'
import { cn } from '~/lib/cn'

/** Small building blocks shared by the admin editors. */

/** Title row of every admin module: H1, one-line purpose and optional actions. */
export function AdminPageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

/** Alert for a module whose data could not load. */
export function LoadError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-xl border border-destructive/40 p-4 text-sm text-destructive">
      {children}
    </p>
  )
}

export function Panel({
  title,
  description,
  className,
  children,
}: {
  title: string
  description?: string
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn('rounded-2xl border border-ink-800 bg-ink-900 p-6', className)}>
      <h2 className="font-display text-xl font-semibold text-ink-50">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-400">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function SaveStatus({ state }: { state: { kind: 'idle' | 'saving' | 'saved' } | { kind: 'error'; message: string } }) {
  if (state.kind === 'idle') return null
  if (state.kind === 'error') {
    return (
      <p role="alert" className="text-sm text-destructive">
        {state.message}
      </p>
    )
  }
  return (
    <p role="status" className="text-sm text-ink-400">
      {state.kind === 'saving' ? 'Saving…' : 'Saved. The site updates within a minute.'}
    </p>
  )
}

export type SaveState = { kind: 'idle' | 'saving' | 'saved' } | { kind: 'error'; message: string }

/** Header actions of a module saved by one button: status, extra actions, then Save. */
export function SaveAllActions({
  state,
  isDirty,
  onSave,
  children,
}: {
  state: SaveState
  isDirty: boolean
  onSave: () => void
  children?: ReactNode
}) {
  const saving = state.kind === 'saving'
  return (
    <>
      {isDirty && (state.kind === 'idle' || state.kind === 'saved') ? (
        <p className="text-sm text-muted-foreground">Unsaved changes</p>
      ) : (
        <SaveStatus state={state} />
      )}
      {children}
      <button type="button" onClick={onSave} disabled={!isDirty || saving} className={buttonPrimary}>
        {saving ? 'Saving…' : 'Save'}
        <kbd aria-hidden="true" className="hidden font-mono text-xs opacity-70 sm:inline">
          ⌘S
        </kbd>
      </button>
    </>
  )
}

export type SaveResult = { ok: true } | { ok: false; error: string }

/** What an editor exposes so one Save button in the page header can save it. */
export interface EditorHandle {
  /** Saves pending changes; resolves to null when there is nothing to save. */
  save: () => Promise<SaveResult | null>
}

export const buttonPrimary =
  'bg-brand-gradient inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-on-gradient hover:opacity-90 disabled:opacity-60'
export const buttonSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-ink-700 px-3 py-2 text-sm font-medium text-ink-100 hover:border-ink-500 disabled:opacity-50'
export const selectClass =
  'h-10 rounded-md border border-ink-700 bg-ink-950 px-3 text-sm text-ink-50 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'

/** First message from a TanStack Form field's errors (Standard Schema issues or strings). */
export function firstError(errors: unknown[]) {
  for (const e of errors) {
    if (typeof e === 'string') return e
    if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') return e.message
  }
  return undefined
}
