import { createFileRoute } from '@tanstack/react-router'
import { handleCreateSchema, handleListSchemas } from '~/server/api/v1'

export const Route = createFileRoute('/api/v1/schemas/')({
  server: {
    handlers: {
      GET: ({ request }) => handleListSchemas(request),
      POST: ({ request }) => handleCreateSchema(request),
    },
  },
})
