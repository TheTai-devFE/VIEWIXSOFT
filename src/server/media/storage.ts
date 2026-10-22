import '@tanstack/react-start/server-only'
import { AwsClient } from 'aws4fetch'
import { getEnv } from '~/server/env'

/**
 * Image storage. Production writes to Cloudflare R2 through its S3 API (works
 * the same from Workers and from Node), and files are served from the bucket's
 * public domain. Without R2 settings, local development writes to .data/uploads
 * and the /media-dev/* route serves them.
 */
interface Storage {
  put: (key: string, body: Uint8Array<ArrayBuffer>, contentType: string) => Promise<{ url: string }>
  remove: (key: string) => Promise<void>
}

function r2(): Storage | null {
  const env = getEnv()
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET || !env.R2_PUBLIC_URL) {
    return null
  }
  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: 's3',
    region: 'auto',
  })
  const endpoint = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}`
  const publicUrl = env.R2_PUBLIC_URL.replace(/\/$/, '')
  return {
    async put(key, body, contentType) {
      const res = await client.fetch(`${endpoint}/${key}`, {
        method: 'PUT',
        body,
        headers: {
          'Content-Type': contentType,
          // Keys are unique per upload, so the file can be cached forever.
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
      if (!res.ok) throw new Error(`R2 upload failed with ${res.status}`)
      return { url: `${publicUrl}/${key}` }
    },
    async remove(key) {
      await client.fetch(`${endpoint}/${key}`, { method: 'DELETE' })
    },
  }
}

const LOCAL_DIR = '.data/uploads'

function local(): Storage {
  return {
    async put(key, body) {
      const { mkdir, writeFile } = await import('node:fs/promises')
      const path = `${LOCAL_DIR}/${key}`
      await mkdir(path.slice(0, path.lastIndexOf('/')), { recursive: true })
      await writeFile(path, body)
      return { url: `/media-dev/${key}` }
    },
    async remove(key) {
      const { rm } = await import('node:fs/promises')
      await rm(`${LOCAL_DIR}/${key}`, { force: true })
    },
  }
}

export function getStorage(): Storage {
  const remote = r2()
  if (remote) return remote
  if (getEnv().NODE_ENV === 'production') throw new Error('R2 is not configured')
  return local()
}

export async function readLocalUpload(key: string) {
  const { readFile } = await import('node:fs/promises')
  return readFile(`${LOCAL_DIR}/${key}`)
}
