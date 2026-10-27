import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/use-cases/$slug')({
  loader: ({ params }) => {
    throw redirect({ href: `/case-studies/${params.slug}`, statusCode: 301 })
  },
  component: () => null,
})
