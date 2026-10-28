import { createFileRoute } from '@tanstack/react-router'
import { handleSchemaTypes } from '~/server/api/v1'

export const Route = createFileRoute('/api/v1/schema-types')({
  server: { handlers: { GET: ({ request }) => handleSchemaTypes(request) } },
})
