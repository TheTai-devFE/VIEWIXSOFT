import { describe, expect, it } from 'vitest'
import { cleanFileName, isWebVtt, sniffVideoType } from '~/server/media/video-file'

const bytes = (...parts: (string | number[])[]) =>
  new Uint8Array(parts.flatMap((p) => (typeof p === 'string' ? [...p].map((c) => c.charCodeAt(0)) : p)))

describe('sniffVideoType', () => {
  it('recognises MP4 by its ftyp box', () => {
    expect(sniffVideoType(bytes([0, 0, 0, 0x20], 'ftypisom', [0, 0]))).toBe('video/mp4')
  })

  it('recognises WebM by its EBML header', () => {
    expect(sniffVideoType(bytes([0x1a, 0x45, 0xdf, 0xa3, 0x9f]))).toBe('video/webm')
  })

  it('rejects other files, whatever their name', () => {
    expect(sniffVideoType(bytes('<html><body>'))).toBeNull()
    expect(sniffVideoType(bytes([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]))).toBeNull()
  })
})

describe('isWebVtt', () => {
  it('accepts WebVTT with or without a byte order mark', () => {
    expect(isWebVtt(bytes('WEBVTT\n\n00:00.000 --> 00:01.000\nHi'))).toBe(true)
    expect(isWebVtt(bytes([0xef, 0xbb, 0xbf], 'WEBVTT\n'))).toBe(true)
  })

  it('rejects SRT and look-alikes', () => {
    expect(isWebVtt(bytes('1\n00:00:00,000 --> 00:00:01,000'))).toBe(false)
    expect(isWebVtt(bytes('WEBVTTX'))).toBe(false)
  })
})

describe('cleanFileName', () => {
  it('keeps the base name and drops markup', () => {
    expect(cleanFileName('C:\\videos\\<tour>.mp4')).toBe('tour.mp4')
  })
})
