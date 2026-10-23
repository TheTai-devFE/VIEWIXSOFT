import { useRouterState } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { ADMIN_NAV } from '~/components/admin/admin-nav'
import { AdminSidebar } from '~/components/admin/AdminSidebar'
import { Sheet, SheetContent, SheetTitle } from '~/components/ui/sheet'
import { useAdminTheme } from '~/hooks/use-admin-theme'
import { cn } from '~/lib/cn'

/** Admin layout: fixed sidebar from lg up, a drawer below it, page content on the right. */
export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  const { theme, setTheme } = useAdminTheme()
  const [open, setOpen] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  // True while the next admin page's loader runs (e.g. a sidebar click).
  const loading = useRouterState({ select: (s) => s.isLoading })
  const current = ADMIN_NAV.flatMap((g) => g.items).find((i) =>
    i.to === '/admin' ? pathname === '/admin' || pathname === '/admin/' : pathname.startsWith(i.to),
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border lg:block">
        <AdminSidebar email={email} theme={theme} onThemeChange={setTheme} />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="h-dvh w-72 gap-0 p-0 sm:max-w-72">
          <SheetTitle className="sr-only">Admin menu</SheetTitle>
          <AdminSidebar email={email} theme={theme} onThemeChange={setTheme} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {loading && (
        <div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden lg:left-64">
          <div className="admin-progress h-full w-1/4 bg-brand-gradient" />
        </div>
      )}
      <p className="sr-only" role="status" aria-live="polite">
        {loading ? 'Loading page' : ''}
      </p>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open admin menu"
            aria-expanded={open}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-border"
          >
            <Menu aria-hidden="true" className="size-4" />
          </button>
          <span className="font-semibold">{current?.label ?? 'Admin'}</span>
        </header>
        <main
          id="main-content"
          aria-busy={loading}
          className={cn(
            'mx-auto max-w-(--breakpoint-2xl) px-4 py-8 transition-opacity duration-200 sm:px-6 lg:px-10 lg:py-10',
            // Keep the old page visible but dimmed until the new one is ready.
            loading && 'pointer-events-none opacity-60',
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
