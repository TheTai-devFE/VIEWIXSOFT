import { createFileRoute } from '@tanstack/react-router'
import { getEnv } from '~/server/env'
import { readLocalUpload } from '~/server/media/storage'

const TYPES: Record<string, string> = {
  webp: 'image/webp',
  avif: 'image/avif',
  jpg: 'image/jpeg',
  png: 'image/png',
  mp4: 'video/mp4',
  webm: 'video/webm',
  vtt: 'text/vtt',
}

// Serves uploads saved to .data/uploads when R2 isn't configured (local dev only).
export const Route = createFileRoute('/media-dev/$')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = params._splat ?? ''
        if (getEnv().NODE_ENV === 'production' || !/^media\/[a-z0-9/.-]+$/.test(key) || key.includes('..')) {
          return new Response('Not found', { status: 404 })
        }
        try {
          const body = await readLocalUpload(key)
          const type = TYPES[key.split('.').pop() ?? ''] ?? 'application/octet-stream'
          return new Response(new Uint8Array(body), { headers: { 'Content-Type': type } })
        } catch {
          return new Response('Not found', { status: 404 })
        }
      },
    },
  },
})
