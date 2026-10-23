/**
 * Recognises uploaded video and caption files by their first bytes, so the
 * stored type comes from the file itself rather than its name or the browser.
 */
export function sniffVideoType(bytes: Uint8Array): 'video/mp4' | 'video/webm' | null {
  const ascii = (at: number, len: number) => String.fromCharCode(...bytes.subarray(at, at + len))
  // MP4 / MOV family: a box size, then the "ftyp" box.
  if (bytes.length >= 12 && ascii(4, 4) === 'ftyp') return 'video/mp4'
  // WebM: an EBML header.
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return 'video/webm'
  }
  return null
}

/** WebVTT files start with "WEBVTT", optionally after a byte order mark. */
export function isWebVtt(bytes: Uint8Array) {
  const start = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0
  const head = String.fromCharCode(...bytes.subarray(start, start + 7))
  return head === 'WEBVTT' || head.startsWith('WEBVTT ') || head.startsWith('WEBVTT\n') || head.startsWith('WEBVTT\r') || head.startsWith('WEBVTT\t')
}

/** A plain file name for display: no path, no markup, at most 200 characters. */
export function cleanFileName(name: string) {
  return (name.split(/[\\/]/).pop() ?? '').replace(/[<>"]/g, '').slice(0, 200) || 'upload'
}
