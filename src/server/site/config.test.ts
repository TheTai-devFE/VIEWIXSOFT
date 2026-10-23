import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Seven result sets, in the order readConfig batches them; only product status varies here.
const rows = (status: string) => [[], [{ slug: 'cms', status }], [], [], [], [], []]
const batch = vi.fn()

vi.mock('~/server/db/client', () => ({ hasDatabase: () => true, getDb: () => ({ batch, select: () => chain }) }))
vi.mock('~/server/logger', () => ({ logger: { error: vi.fn() }, errorFields: () => ({}) }))
// Query builders are only passed through to the mocked batch.
const chain: Record<string, () => unknown> = new Proxy({}, { get: () => () => chain })

const { invalidateSiteConfig, loadSiteConfig } = await import('~/server/site/config')

describe('loadSiteConfig', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    batch.mockReset()
    invalidateSiteConfig()
  })
  afterEach(() => vi.useRealTimers())

  it('reads once for concurrent requests, in one batch', async () => {
    batch.mockResolvedValue(rows('available'))
    const [a, b] = await Promise.all([loadSiteConfig(), loadSiteConfig()])
    expect(a).toBe(b)
    expect(batch).toHaveBeenCalledOnce()
  })

  it('serves the old copy at once after 30 s and refreshes in the background', async () => {
    batch.mockResolvedValueOnce(rows('available'))
    await loadSiteConfig()
    vi.advanceTimersByTime(31_000)

    let release: (v: unknown) => void = () => {}
    batch.mockReturnValueOnce(new Promise((r) => (release = r)))
    expect((await loadSiteConfig()).products.cms).toBe('available')

    release(rows('coming-soon'))
    await vi.waitFor(async () => expect((await loadSiteConfig()).products.cms).toBe('coming-soon'))
  })

  it('waits for fresh settings after an admin save, ignoring a read that started before it', async () => {
    batch.mockResolvedValueOnce(rows('available'))
    await loadSiteConfig()
    vi.advanceTimersByTime(31_000)

    let releaseOld: (v: unknown) => void = () => {}
    batch.mockReturnValueOnce(new Promise((r) => (releaseOld = r)))
    await loadSiteConfig()

    invalidateSiteConfig()
    batch.mockResolvedValueOnce(rows('hidden'))
    expect((await loadSiteConfig()).products.cms).toBe('hidden')

    releaseOld(rows('available'))
    await Promise.resolve()
    expect((await loadSiteConfig()).products.cms).toBe('hidden')
  })
})
