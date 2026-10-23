import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'

const STORAGE_KEY = 'viewixsoft-cookie-consent'

type Choice = 'accepted' | 'declined'

function readChoice(): Choice | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    return v === 'accepted' || v === 'declined' ? v : null
  } catch {
    return null
  }
}

/**
 * Cookie notice shown on the first visit until the visitor accepts or declines.
 * It renders only after mount, so the SSR HTML stays identical for everyone.
 */
export function CookieConsent() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(readChoice() === null)
  }, [])

  if (!open) return null

  const choose = (choice: Choice) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, choice)
    } catch {
      // Storage blocked: hide for this page view and ask again next visit.
    }
    setOpen(false)
  }

  return (
    <section
      aria-label="Cookie consent"
      className="fixed inset-x-4 bottom-4 z-50 rounded-xl border border-ink-800 bg-ink-900 p-4 shadow-lg sm:inset-x-auto sm:left-4 sm:max-w-sm"
    >
      <p className="text-xs text-ink-300">
        Viewixsoft uses cookies to keep the site working and to understand how it is used. Read our{' '}
        <Link to="/legal/cookies" className="text-signal-400 underline hover:text-signal-300">
          Cookie Policy
        </Link>
        .
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => choose('declined')}
          className="rounded-lg border border-input px-3 py-1.5 text-xs font-semibold text-ink-200 hover:border-ink-600"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => choose('accepted')}
          className="bg-brand-gradient rounded-lg px-3 py-1.5 text-xs font-semibold text-on-gradient hover:opacity-90"
        >
          Accept
        </button>
      </div>
    </section>
  )
}
