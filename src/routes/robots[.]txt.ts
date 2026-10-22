import { createFileRoute } from '@tanstack/react-router'
import { buildRobotsTxt, textResponse } from '~/lib/seo/generators'

export const Route = createFileRoute('/robots.txt')({
  server: { handlers: { GET: () => textResponse(buildRobotsTxt(), 'text/plain') } },
})
