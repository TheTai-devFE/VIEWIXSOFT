import { useCallback, useEffect, useState } from 'react'

export type AdminTheme = 'light' | 'dark'

export const ADMIN_THEME_KEY = 'viewixsoft-admin-theme'

/**
 * Runs in the admin <head> before first paint, so a dark admin never flashes
 * light. Kept as a string because it executes before any bundle loads.
 */
export const ADMIN_THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem('${ADMIN_THEME_KEY}');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}if(t==='dark'&&location.pathname.indexOf('/admin')===0)document.documentElement.classList.add('dark')}catch(e){}`

function readTheme(): AdminTheme {
  try {
    const stored = localStorage.getItem(ADMIN_THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Storage blocked (private mode): fall back to the system preference.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Light/dark theme for the admin only. The `dark` class goes on <html> so
 * portalled UI (drawers, dialogs) follows it, and is removed when leaving the
 * admin so the marketing site stays light.
 */
export function useAdminTheme() {
  // null until the stored choice is read on the client, so the first render
  // (which matches the server HTML) never strips the class the boot script set.
  const [theme, setThemeState] = useState<AdminTheme | null>(null)

  useEffect(() => {
    setThemeState(readTheme())
    return () => document.documentElement.classList.remove('dark')
  }, [])

  useEffect(() => {
    if (theme) document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const setTheme = useCallback((next: AdminTheme) => {
    // Apply synchronously so a View Transition snapshot sees the new theme.
    document.documentElement.classList.toggle('dark', next === 'dark')
    setThemeState(next)
    try {
      localStorage.setItem(ADMIN_THEME_KEY, next)
    } catch {
      // Not persisted; the choice still applies for this visit.
    }
  }, [])

  return { theme: theme ?? 'light', ready: theme !== null, setTheme }
}
