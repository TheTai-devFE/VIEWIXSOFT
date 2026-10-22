import { Link, useRouter } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { ADMIN_NAV } from '~/components/admin/admin-nav'
import { ViewixLogo } from '~/components/blocks/ViewixLogo'
import { AnimatedThemeToggler } from '~/components/ui/animated-theme-toggler'
import type { AdminTheme } from '~/hooks/use-admin-theme'
import { authClient } from '~/lib/auth-client'

interface Props {
  email: string
  theme: AdminTheme
  onThemeChange: (theme: AdminTheme) => void
  /** Called after a link is chosen, so the mobile drawer can close. */
  onNavigate?: () => void
}

/** Admin navigation: module groups, then theme, account and sign-out at the bottom. */
export function AdminSidebar({ email, theme, onThemeChange, onNavigate }: Props) {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-5">
        {/* A plain link: TanStack's <Link> would mark the logo aria-current on every admin page. */}
        <a
          href="/admin"
          onClick={(e) => {
            e.preventDefault()
            onNavigate?.()
            void router.navigate({ to: '/admin' })
          }}
          aria-label="Admin dashboard"
          className="text-foreground"
        >
          <ViewixLogo className="h-5" withSoft />
        </a>
        <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
          Admin
        </span>
      </div>

      <nav aria-label="Admin" className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {ADMIN_NAV.map((section) => (
          <div key={section.group} className="mb-5">
            <p className="px-3 pb-2 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              {section.group}
            </p>
            <ul className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    onClick={onNavigate}
                    activeOptions={{ exact: to === '/admin' }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                    activeProps={{
                      className: 'bg-background text-foreground shadow-sm ring-1 ring-border',
                      'aria-current': 'page',
                    }}
                  >
                    <Icon aria-hidden="true" className="size-4 shrink-0" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-border p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Theme</span>
          <AnimatedThemeToggler theme={theme} onThemeChange={onThemeChange} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-xs text-muted-foreground" title={email}>
            {email}
          </span>
          <button
            type="button"
            disabled={signingOut}
            onClick={async () => {
              setSigningOut(true)
              await authClient.signOut()
              await router.navigate({ to: '/admin/login', search: { redirect: undefined } })
            }}
            aria-label="Sign out"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-60"
          >
            <LogOut aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
