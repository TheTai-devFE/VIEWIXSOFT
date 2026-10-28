import { createFileRoute } from '@tanstack/react-router'
import { handlePostFormat } from '~/server/api/posts'

export const Route = createFileRoute('/api/v1/posts/format')({
  server: { handlers: { GET: ({ request }) => handlePostFormat(request) } },
})
