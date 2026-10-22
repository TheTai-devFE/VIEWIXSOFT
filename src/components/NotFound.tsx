import { Link } from '@tanstack/react-router'
import { ScreenShareOff, ArrowLeft, Home } from 'lucide-react'

export function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-signal-500/10 border border-signal-500/20 flex items-center justify-center text-signal-400 mb-6 shadow-xl">
        <ScreenShareOff className="w-10 h-10" />
      </div>

      <span className="text-xs uppercase tracking-widest text-signal-400 font-semibold mb-2">
        404 — Screen Signal Lost
      </span>
      <h1 className="text-4xl font-extrabold tracking-tight text-ink-50 mb-3">
        Page Not Found
      </h1>
      <p className="text-ink-400 max-w-md mb-8 text-base">
        The channel or endpoint you are looking for has been moved, unpublished, or does not exist in our network.
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-ink-800 hover:bg-ink-700 text-ink-50 font-medium border border-ink-700 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-signal-500 hover:bg-brand-gradient shine text-on-gradient font-semibold transition-all"
        >
          <Home className="w-4 h-4" /> Viewixsoft Home
        </Link>
      </div>
    </div>
  )
}
