import '@tanstack/react-start/server-only'
import { AwsClient } from 'aws4fetch'
import { getEnv } from '~/server/env'

/**
 * Image, video and caption storage. Production writes to Cloudflare R2 through its S3 API (works
 * the same from Workers and from Node), and files are served from the bucket's
 * public domain. Without R2 settings, local development writes to .data/uploads
 * and the /media-dev/* route serves them.
 */
interface Storage {
  put: (key: string, body: Uint8Array<ArrayBuffer>, contentType: string) => Promise<{ url: string }>
  remove: (key: string) => Promise<void>
  /** Where a stored file is served from. */
  urlFor: (key: string) => string
  /** Browser-to-bucket uploads for files too big to pass through a Worker; R2 only. */
  direct?: DirectUploads
}

interface DirectUploads {
  /** A URL the browser can PUT one file to, valid for an hour. */
  presignPut: (key: string, contentType: string) => Promise<string>
  /** Size of a stored file, or null when it isn't there. */
  size: (key: string) => Promise<number | null>
  /** The first bytes of a stored file, to check what it really is. */
  readStart: (key: string, length: number) => Promise<Uint8Array | null>
}

// Keys are unique per upload, so the file can be cached forever.
export const UPLOAD_CACHE_CONTROL = 'public, max-age=31536000, immutable'

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
        headers: { 'Content-Type': contentType, 'Cache-Control': UPLOAD_CACHE_CONTROL },
      })
      if (!res.ok) throw new Error(`R2 upload failed with ${res.status}`)
      return { url: `${publicUrl}/${key}` }
    },
    async remove(key) {
      await client.fetch(`${endpoint}/${key}`, { method: 'DELETE' })
    },
    urlFor: (key) => `${publicUrl}/${key}`,
    direct: {
      async presignPut(key, contentType) {
        const url = new URL(`${endpoint}/${key}`)
        url.searchParams.set('X-Amz-Expires', '3600')
        // Both headers are signed, so the browser must send exactly these values.
        const signed = await client.sign(url.toString(), {
          method: 'PUT',
          headers: { 'Content-Type': contentType, 'Cache-Control': UPLOAD_CACHE_CONTROL },
          aws: { signQuery: true },
        })
        return signed.url
      },
      async size(key) {
        const res = await client.fetch(`${endpoint}/${key}`, { method: 'HEAD' })
        return res.ok ? Number(res.headers.get('content-length') ?? 0) : null
      },
      async readStart(key, length) {
        const res = await client.fetch(`${endpoint}/${key}`, { headers: { Range: `bytes=0-${length - 1}` } })
        return res.ok ? new Uint8Array(await res.arrayBuffer()) : null
      },
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
    urlFor: (key) => `/media-dev/${key}`,
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
