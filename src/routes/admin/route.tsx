import { createFileRoute, Link, Outlet, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '~/lib/auth-client'
import { generateMetaTags } from '~/lib/seo/meta'
import { getAdminSessionFn } from '~/server/functions/admin'

const ADMIN_LINKS = [
  { to: '/admin/leads', label: 'Leads' },
  { to: '/admin/site', label: 'Site sections' },
  { to: '/admin/media', label: 'Images' },
] as const

export const Route = createFileRoute('/admin')({
  // Runs on the server for the first load and on every client navigation, so a
  // signed-out visitor never reaches an admin page. Server functions check again.
  beforeLoad: async ({ location }) => {
    if (location.pathname === '/admin/login') return { admin: null }
    const admin = await getAdminSessionFn()
    if (!admin) throw redirect({ to: '/admin/login', search: { redirect: location.pathname } })
    return { admin }
  },
  head: () => {
    const seo = generateMetaTags({ title: 'Admin', description: 'Viewixsoft admin.', noindex: true, canonicalUrl: '/admin' })
    return { meta: seo.meta }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const { admin } = Route.useRouteContext()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  if (!admin) return <Outlet />

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-800 pb-4">
        <nav aria-label="Admin">
          <ul className="flex flex-wrap gap-1">
            {ADMIN_LINKS.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="rounded-md px-3 py-2 text-sm font-medium text-ink-400 hover:text-ink-50"
                  activeProps={{ className: 'bg-ink-900 text-ink-50', 'aria-current': 'page' }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-3 text-sm text-ink-400">
          <span>{admin.email}</span>
          <button
            type="button"
            disabled={signingOut}
            onClick={async () => {
              setSigningOut(true)
              await authClient.signOut()
              await router.navigate({ to: '/admin/login', search: { redirect: undefined } })
            }}
            className="rounded-md border border-ink-700 px-3 py-1.5 font-medium text-ink-100 hover:border-ink-500 disabled:opacity-60"
          >
            Sign out
          </button>
        </div>
      </div>
      <Outlet />
    </div>
  )
}
