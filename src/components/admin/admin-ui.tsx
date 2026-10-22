import type { ReactNode } from 'react'

/** Small building blocks shared by the admin editors. */

export function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-ink-800 bg-ink-900 p-6">
      <h2 className="font-display text-xl font-semibold text-ink-50">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-400">{description}</p>}
      <div className="mt-5">{children}</div>
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
