import { describe, expect, it } from 'vitest'
import { fitWithin, MAX_EDGE, renameFor, TARGET_BYTES } from '~/lib/image-prepare'
import { MAX_IMAGE_BYTES } from '~/data/media-slots'

describe('fitWithin', () => {
  it('shrinks the longest side to the limit and keeps the proportions', () => {
    expect(fitWithin(4000, 3000, 2000)).toEqual({ width: 2000, height: 1500 })
    expect(fitWithin(1080, 3840, 2000)).toEqual({ width: 563, height: 2000 })
  })

  it('never enlarges a small image', () => {
    expect(fitWithin(800, 600, 2000)).toEqual({ width: 800, height: 600 })
  })
})

describe('renameFor', () => {
  it('swaps the extension for the new format', () => {
    expect(renameFor('menu board.PNG', 'image/webp')).toBe('menu board.webp')
    expect(renameFor('photo.jpeg', 'image/jpeg')).toBe('photo.jpg')
    expect(renameFor('.png', 'image/png')).toBe('image.png')
  })
})

it('aims below the server limit, leaving room for files that cannot shrink further', () => {
  expect(TARGET_BYTES).toBeLessThan(MAX_IMAGE_BYTES)
  expect(MAX_EDGE).toBeLessThanOrEqual(6000)
})
