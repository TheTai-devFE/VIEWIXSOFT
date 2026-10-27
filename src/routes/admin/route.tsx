import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AdminShell } from '~/components/admin/AdminShell'
import { canOpen, homeFor, navItemFor } from '~/components/admin/admin-nav'
import { ADMIN_THEME_BOOT_SCRIPT } from '~/hooks/use-admin-theme'
import { generateMetaTags } from '~/lib/seo/meta'
import { getAdminSessionFn } from '~/server/functions/admin'

// Admin loaders use `staleReloadMode: 'blocking'`: editors and lists copy loader data into local
// state once, so showing the cached copy while the fresh one loads would show content from before a save.
export const Route = createFileRoute('/admin')({
  // Runs on the server for the first load and on every client navigation, so a
  // signed-out visitor never reaches an admin page. Server functions check again.
  beforeLoad: async ({ location }) => {
    if (location.pathname === '/admin/login') return { admin: null }
    const admin = await getAdminSessionFn()
    if (!admin) throw redirect({ to: '/admin/login', search: { redirect: location.pathname } })
    // Pages outside an account's permissions send it to its first allowed module.
    const item = navItemFor(location.pathname)
    if (item && !canOpen(admin, item)) throw redirect({ to: homeFor(admin) })
    return { admin }
  },
  head: () => {
    const seo = generateMetaTags({ title: 'Admin', description: 'Viewixsoft admin.', noindex: true, canonicalUrl: '/admin' })
    return {
      meta: seo.meta,
      // Applies the saved light/dark choice before first paint.
      scripts: [{ children: ADMIN_THEME_BOOT_SCRIPT }],
    }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const { admin } = Route.useRouteContext()
  if (!admin) return <Outlet />
  return (
    <AdminShell admin={admin}>
      <Outlet />
    </AdminShell>
  )
}
