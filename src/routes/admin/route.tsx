import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AdminShell } from '~/components/admin/AdminShell'
import { ADMIN_THEME_BOOT_SCRIPT } from '~/hooks/use-admin-theme'
import { generateMetaTags } from '~/lib/seo/meta'
import { getAdminSessionFn } from '~/server/functions/admin'

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
    <AdminShell email={admin.email}>
      <Outlet />
    </AdminShell>
  )
}
