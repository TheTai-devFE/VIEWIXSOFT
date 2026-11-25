import { readFile } from 'node:fs/promises'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleUploadImage } from '~/server/api/media'

const deps = vi.hoisted(() => ({
  authenticate: vi.fn(), put: vi.fn(), remove: vi.fn(), insert: vi.fn(),
}))
vi.mock('~/server/api-keys/repository', () => ({ authenticateApiKey: deps.authenticate }))
vi.mock('~/server/media/storage', () => ({ getStorage: () => deps }))
vi.mock('~/server/media/repository', () => ({ insertMediaAsset: deps.insert }))
vi.mock('~/server/logger', () => ({ errorFields: () => ({}), logger: { error: vi.fn() } }))

const metadata = { alt: 'A tablet signage kiosk', title: 'Tablet kiosk', caption: 'The entrance screen', description: 'An interactive kiosk at the entrance.' }
async function uploadForm() {
  const form = new FormData()
  const image = await readFile('public/devices/stock/tablet-kiosk.webp')
  form.set('file', new File([new Uint8Array(image)], 'kiosk.webp'))
  for (const [name, value] of Object.entries(metadata)) form.set(name, value)
  return form
}
function send(form: FormData) {
  return handleUploadImage(new Request('https://example.org/api/v1/media', {
    method: 'POST', headers: { authorization: 'Bearer test' }, body: form,
  }))
}

describe('POST /api/v1/media', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    deps.authenticate.mockResolvedValue({ scopes: ['media:write'], createdBy: 'editor' })
    deps.put.mockResolvedValue({ url: '/media-dev/kiosk.webp' })
    deps.insert.mockResolvedValue({ id: 'image-id' })
  })
  it('stores the file and all metadata and returns the hosted URL', async () => {
    const res = await send(await uploadForm())
    expect(res.status).toBe(201)
    expect(await res.json()).toMatchObject({ data: { id: 'image-id', url: '/media-dev/kiosk.webp', ...metadata } })
    expect(deps.insert).toHaveBeenCalledWith(expect.objectContaining({
      imageTitle: metadata.title, description: metadata.description, caption: metadata.caption, alt: metadata.alt, contentType: 'image/webp',
    }))
  })
  it('rejects write-only blog keys before storing a file', async () => {
    deps.authenticate.mockResolvedValue({ scopes: ['blog:write'] })
    expect((await send(await uploadForm())).status).toBe(403)
    expect(deps.put).not.toHaveBeenCalled()
  })
  it('requires image metadata and verifies the file contents', async () => {
    const form = await uploadForm()
    form.delete('caption')
    expect((await send(form)).status).toBe(422)
    form.set('caption', metadata.caption)
    form.set('file', new File(['unsupported'], 'test.png', { type: 'image/png' }))
    expect((await send(form)).status).toBe(422)
    expect(deps.put).not.toHaveBeenCalled()
  })
  it('rejects alt text that is too short, too long or reads as a file name', async () => {
    for (const alt of ['Kiosk', 'kiosk_01.webp', 'A'.repeat(126)]) {
      const form = await uploadForm()
      form.set('alt', alt)
      expect((await send(form)).status, alt).toBe(422)
    }
    expect(deps.put).not.toHaveBeenCalled()
  })
  it('rejects oversized multipart uploads before persisting bytes', async () => {
    const form = await uploadForm()
    form.set('file', new File([new Uint8Array(2 * 1024 * 1024)], 'big.png'))
    const envelope = new Response(form)
    const request = new Request('https://example.org/api/v1/media', {
      method: 'POST', headers: { authorization: 'Bearer test', 'content-type': envelope.headers.get('content-type') ?? '' },
      body: await envelope.arrayBuffer(),
    })
    expect((await handleUploadImage(request)).status).toBe(413)
    expect(deps.put).not.toHaveBeenCalled()
  })
  it('removes the uploaded object if the database write fails', async () => {
    deps.insert.mockRejectedValue(new Error('database unavailable'))
    expect((await send(await uploadForm())).status).toBe(500)
    expect(deps.remove).toHaveBeenCalledWith(deps.put.mock.calls[0]?.[0])
  })
})
