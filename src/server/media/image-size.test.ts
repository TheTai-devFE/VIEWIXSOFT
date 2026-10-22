import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { readImageSize } from './image-size'

const file = (p: string) => new Uint8Array(readFileSync(p))

describe('readImageSize', () => {
  it('reads PNG', () => {
    expect(readImageSize(file('public/logo.png'))).toEqual({ type: 'image/png', width: 512, height: 512 })
  })

  it('reads JPEG', () => {
    expect(readImageSize(file('public/og-image.jpg'))).toEqual({ type: 'image/jpeg', width: 1200, height: 630 })
  })

  it('reads WebP', () => {
    expect(readImageSize(file('public/devices/stock/retail-screens.webp'))).toEqual({
      type: 'image/webp',
      width: 960,
      height: 540,
    })
  })

  it('rejects other content', () => {
    expect(readImageSize(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBeNull()
    expect(readImageSize(new Uint8Array(4))).toBeNull()
  })
})
