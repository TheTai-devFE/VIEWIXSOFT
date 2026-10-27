import { beforeEach, describe, expect, it, vi } from 'vitest'

const session = vi.fn<() => Promise<{ userId?: string; name?: string; email: string; role: 'admin' | 'user'; permissions: string[] } | null>>()
const put = vi.fn(async (key: string) => ({ url: `/media-dev/${key}` }))
const remove = vi.fn(async () => undefined)
// Set per test: R2's browser-to-bucket uploads, or undefined for local storage.
let direct:
  | { presignPut: () => Promise<string>; size: () => Promise<number | null>; readStart: () => Promise<Uint8Array | null> }
  | undefined
const insertMediaAsset = vi.fn(async (row: Record<string, unknown>) => row)

vi.mock('~/server/auth', () => ({ getAdminSession: () => session() }))
vi.mock('~/server/media/storage', () => ({
  UPLOAD_CACHE_CONTROL: 'public, max-age=31536000, immutable',
  getStorage: () => ({ put, remove, direct, urlFor: (k: string) => `https://cdn.example/${k}` }),
}))
vi.mock('~/server/media/repository', () => ({ insertMediaAsset }))
vi.mock('~/server/activity/repository', () => ({ logActivity: vi.fn() }))
vi.mock('~/server/logger', () => ({ logger: { info: vi.fn(), error: vi.fn() }, errorFields: () => ({}) }))

const { handleMediaUpload } = await import('~/routes/api/admin/media-upload')

const MP4 = new Uint8Array([0, 0, 0, 0x20, ...[...'ftypisom'].map((c) => c.charCodeAt(0)), 0, 0, 2, 0])

function request(fields: Record<string, string | Blob>, headers: Record<string, string> = {}) {
  const body = new FormData()
  for (const [k, v] of Object.entries(fields)) body.set(k, v instanceof Blob ? new File([v], 'product-tour.mp4') : v)
  return new Request('http://localhost/api/admin/media-upload', { method: 'POST', body, headers })
}

const video = { kind: 'video', file: new Blob([MP4]), width: '1920', height: '1080' }

describe('media upload route', () => {
  beforeEach(() => {
    session.mockResolvedValue({ email: 'admin@example.com', role: 'admin', permissions: [] })
    put.mockClear()
    remove.mockClear()
    insertMediaAsset.mockClear()
    direct = undefined
  })

  it('adds an MP4 to the library', async () => {
    const res = await handleMediaUpload(request(video))
    expect(await res.json()).toEqual({ ok: true, kind: 'video' })
    expect(insertMediaAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        contentType: 'video/mp4',
        width: 1920,
        height: 1080,
        bytes: MP4.length,
        fileName: 'product-tour.mp4',
        storageKey: expect.stringMatching(/^media\/library\/[a-z0-9-]+\.mp4$/),
      }),
    )
  })

  it('refuses visitors without an admin session', async () => {
    session.mockResolvedValue(null)
    expect((await handleMediaUpload(request(video))).status).toBe(401)
    expect(put).not.toHaveBeenCalled()
  })

  it('refuses accounts without an editor or media permission', async () => {
    session.mockResolvedValue({ email: 'sales@example.com', role: 'user', permissions: ['leads'] })
    expect((await handleMediaUpload(request(video))).status).toBe(403)
    expect(put).not.toHaveBeenCalled()
  })

  it('lets a blog writer upload', async () => {
    session.mockResolvedValue({ email: 'mkt@example.com', role: 'user', permissions: ['blog'] })
    expect((await handleMediaUpload(request(video))).status).toBe(200)
  })

  it('refuses cross-site posts', async () => {
    expect((await handleMediaUpload(request(video, { origin: 'https://evil.example' }))).status).toBe(403)
  })

  it('refuses a file that is not a video, whatever its name', async () => {
    const res = await handleMediaUpload(request({ ...video, file: new Blob(['<html></html>']) }))
    expect(await res.json()).toMatchObject({ ok: false })
    expect(put).not.toHaveBeenCalled()
  })

  it('refuses a video the browser could not measure', async () => {
    const res = await handleMediaUpload(request({ kind: 'video', file: new Blob([MP4]) }))
    expect(await res.json()).toMatchObject({ ok: false })
    expect(insertMediaAsset).not.toHaveBeenCalled()
  })

  it('stores WebVTT captions outside the library and refuses other text', async () => {
    const vtt = await handleMediaUpload(request({ kind: 'captions', file: new Blob(['WEBVTT\n\n00:00.000 --> 00:01.000\nHi']) }))
    expect(await vtt.json()).toMatchObject({ ok: true, kind: 'captions', file: { storageKey: expect.stringMatching(/^media\/captions\//) } })
    expect(insertMediaAsset).not.toHaveBeenCalled()
    const srt = await handleMediaUpload(request({ kind: 'captions', file: new Blob(['1\n00:00:00,000 --> 00:00:01,000']) }))
    expect(await srt.json()).toMatchObject({ ok: false })
  })

  describe('straight to R2', () => {
    const KEY = 'media/library/1761200000000-ab12cd34.mp4'
    const start = { kind: 'video-start', fileName: 'tour.mp4', contentType: 'video/mp4', bytes: String(78 * 1024 * 1024), width: '1920', height: '1080' }
    const finish = { kind: 'video-finish', key: KEY, fileName: 'tour.mp4', width: '1920', height: '1080' }

    beforeEach(() => {
      direct = {
        presignPut: vi.fn(async () => 'https://r2.example/signed'),
        size: vi.fn(async () => 78 * 1024 * 1024),
        readStart: vi.fn(async () => MP4),
      }
    })

    it('hands out a signed URL for a video over the old 50 MB limit', async () => {
      const json = await (await handleMediaUpload(request(start))).json()
      expect(json).toMatchObject({ ok: true, kind: 'video-start', mode: 'direct', uploadUrl: 'https://r2.example/signed' })
      expect(json.key).toMatch(/^media\/library\/\d+-[a-f0-9]{8}\.mp4$/)
    })

    it('refuses to start a video over 200 MB', async () => {
      const json = await (await handleMediaUpload(request({ ...start, bytes: String(201 * 1024 * 1024) }))).json()
      expect(json).toMatchObject({ ok: false })
    })

    it('adds the stored file to the library once it checks out', async () => {
      expect(await (await handleMediaUpload(request(finish))).json()).toEqual({ ok: true, kind: 'video' })
      expect(insertMediaAsset).toHaveBeenCalledWith(
        expect.objectContaining({ storageKey: KEY, url: `https://cdn.example/${KEY}`, contentType: 'video/mp4', width: 1920 }),
      )
    })

    it('removes a stored file that is not a video', async () => {
      direct = {
        presignPut: vi.fn(async () => 'https://r2.example/signed'),
        size: vi.fn(async () => 1024),
        readStart: vi.fn(async () => new Uint8Array([60, 104, 116, 109, 108, 62])),
      }
      expect(await (await handleMediaUpload(request(finish))).json()).toMatchObject({ ok: false })
      expect(remove).toHaveBeenCalledWith(KEY)
      expect(insertMediaAsset).not.toHaveBeenCalled()
    })

    it('only finishes keys it hands out', async () => {
      const res = await handleMediaUpload(request({ ...finish, key: 'media/library/someone-elses.mp4' }))
      expect(await res.json()).toMatchObject({ ok: false })
      expect(insertMediaAsset).not.toHaveBeenCalled()
    })

    it('no longer takes whole videos through the server', async () => {
      expect(await (await handleMediaUpload(request(video))).json()).toMatchObject({ ok: false })
      expect(put).not.toHaveBeenCalled()
    })
  })
})
