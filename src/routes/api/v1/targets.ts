import { createFileRoute } from '@tanstack/react-router'
import { handleTargets } from '~/server/api/v1'

export const Route = createFileRoute('/api/v1/targets')({
  server: { handlers: { GET: ({ request }) => handleTargets(request) } },
})
