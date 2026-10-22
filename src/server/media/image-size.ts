/**
 * Reads width and height from the header of a PNG, JPEG, WebP or AVIF file,
 * so stored dimensions come from the file itself rather than the browser.
 */
export function readImageSize(bytes: Uint8Array): { width: number; height: number; type: string } | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const ascii = (at: number, len: number) => String.fromCharCode(...bytes.subarray(at, at + len))

  // PNG: IHDR is the first chunk.
  if (bytes.length >= 24 && view.getUint32(0) === 0x89504e47 && ascii(12, 4) === 'IHDR') {
    return { type: 'image/png', width: view.getUint32(16), height: view.getUint32(20) }
  }

  // WebP: RIFF....WEBP then VP8 / VP8L / VP8X.
  if (bytes.length >= 30 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') {
    const chunk = ascii(12, 4)
    if (chunk === 'VP8 ') {
      return { type: 'image/webp', width: view.getUint16(26, true) & 0x3fff, height: view.getUint16(28, true) & 0x3fff }
    }
    if (chunk === 'VP8L') {
      const b = view.getUint32(21, true)
      return { type: 'image/webp', width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 }
    }
    if (chunk === 'VP8X') {
      const w = (bytes[24] ?? 0) | ((bytes[25] ?? 0) << 8) | ((bytes[26] ?? 0) << 16)
      const h = (bytes[27] ?? 0) | ((bytes[28] ?? 0) << 8) | ((bytes[29] ?? 0) << 16)
      return { type: 'image/webp', width: w + 1, height: h + 1 }
    }
    return null
  }

  // JPEG: walk the segments to the first SOFn marker.
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) return null
      const marker = bytes[i + 1] ?? 0
      const length = view.getUint16(i + 2)
      const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
      if (isSof) return { type: 'image/jpeg', height: view.getUint16(i + 5), width: view.getUint16(i + 7) }
      i += 2 + length
    }
    return null
  }

  // AVIF: ISO-BMFF with an `ispe` (image spatial extents) property near the start.
  if (bytes.length >= 12 && ascii(4, 4) === 'ftyp' && /avi[fs]/.test(ascii(8, 4))) {
    for (let i = 0; i + 16 <= bytes.length && i < 4096; i++) {
      if (bytes[i] === 0x69 && ascii(i, 4) === 'ispe') {
        return { type: 'image/avif', width: view.getUint32(i + 8), height: view.getUint32(i + 12) }
      }
    }
  }
  return null
}
