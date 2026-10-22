import { createFileRoute, redirect } from '@tanstack/react-router'

// The old all-in-one settings page is now split into modules.
export const Route = createFileRoute('/admin/site')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/pages' })
  },
})
