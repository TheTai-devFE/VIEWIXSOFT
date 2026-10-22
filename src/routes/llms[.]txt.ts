import { createFileRoute } from '@tanstack/react-router'
import { buildLlmsTxt, textResponse } from '~/lib/seo/generators'

export const Route = createFileRoute('/llms.txt')({
  server: { handlers: { GET: () => textResponse(buildLlmsTxt(), 'text/plain') } },
})
