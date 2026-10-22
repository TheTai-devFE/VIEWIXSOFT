import { createFileRoute } from '@tanstack/react-router'
import { buildLlmsFullTxt, textResponse } from '~/lib/seo/generators'

export const Route = createFileRoute('/llms-full.txt')({
  server: { handlers: { GET: () => textResponse(buildLlmsFullTxt(), 'text/plain') } },
})
