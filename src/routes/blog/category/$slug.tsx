import { createFileRoute, redirect } from '@tanstack/react-router'

// Categories aren't built yet (posts filter by product); send them to the index.
export const Route = createFileRoute('/blog/category/$slug')({
  beforeLoad: () => {
    throw redirect({ to: '/blog', statusCode: 301 })
  },
})
