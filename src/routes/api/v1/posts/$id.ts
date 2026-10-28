import { createFileRoute } from '@tanstack/react-router'
import { handleGetPost, handleUpdatePost } from '~/server/api/posts'

export const Route = createFileRoute('/api/v1/posts/$id')({
  server: {
    handlers: {
      GET: ({ request, params }) => handleGetPost(request, params.id),
      PUT: ({ request, params }) => handleUpdatePost(request, params.id),
    },
  },
})
