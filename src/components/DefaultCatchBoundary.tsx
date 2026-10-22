import { ErrorComponent, Link, useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter()

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-6 shadow-lg">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-ink-50 mb-2">
        Something unexpected happened
      </h1>
      <p className="text-ink-400 max-w-md mb-6">
        An error occurred while loading this page. Our telemetry has recorded this incident.
      </p>

      {error ? (
        <div className="bg-ink-900/80 border border-ink-800 rounded-lg p-4 mb-6 max-w-lg text-left overflow-auto text-xs font-mono text-red-300">
          {(error as any)?.message || String(error)}
        </div>
      ) : null}

      <div className="flex gap-4">
        <button
          onClick={() => router.invalidate()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-signal-500 hover:bg-brand-gradient shine text-on-gradient font-semibold transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" /> Try again
        </button>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-ink-800 hover:bg-ink-700 text-ink-50 font-medium border border-ink-700 transition-all"
        >
          <Home className="w-4 h-4" /> Go to Homepage
        </Link>
      </div>
    </div>
  )
}
