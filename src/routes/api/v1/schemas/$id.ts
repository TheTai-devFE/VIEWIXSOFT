import { createFileRoute } from '@tanstack/react-router'
import { handleDeleteSchema, handleGetSchema, handleUpdateSchema } from '~/server/api/v1'

export const Route = createFileRoute('/api/v1/schemas/$id')({
  server: {
    handlers: {
      GET: ({ request, params }) => handleGetSchema(request, params.id),
      PUT: ({ request, params }) => handleUpdateSchema(request, params.id),
      DELETE: ({ request, params }) => handleDeleteSchema(request, params.id),
    },
  },
})
