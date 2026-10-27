import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/use-cases/')({
  loader: () => {
    throw redirect({ href: '/case-studies', statusCode: 301 })
  },
  component: () => null,
})
