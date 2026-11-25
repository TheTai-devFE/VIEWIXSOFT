import { createFileRoute } from '@tanstack/react-router'
import { handleUploadImage } from '~/server/api/media'

export const Route = createFileRoute('/api/v1/media')({
  server: { handlers: { POST: ({ request }) => handleUploadImage(request) } },
})
