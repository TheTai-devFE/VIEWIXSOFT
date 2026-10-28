import { createFileRoute } from '@tanstack/react-router'
import { handleCreatePost, handleListPosts } from '~/server/api/posts'

export const Route = createFileRoute('/api/v1/posts/')({
  server: {
    handlers: {
      GET: ({ request }) => handleListPosts(request),
      POST: ({ request }) => handleCreatePost(request),
    },
  },
})
