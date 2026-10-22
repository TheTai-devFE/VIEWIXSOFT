import '@tanstack/react-start/server-only'

const encoder = new TextEncoder()

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function toBase64Url(buffer: ArrayBuffer) {
  let binary = ''
  for (const b of new Uint8Array(buffer)) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmac(secret: string, value: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ])
  return crypto.subtle.sign('HMAC', key, encoder.encode(value))
}

/** Keyed hash of a visitor IP. Only this hash is stored, never the raw IP. */
export async function hashIp(ip: string, salt: string) {
  return toHex(await hmac(salt, `ip:${ip}`))
}

/** Signed token that proves an email address received our message. */
export async function signToken(secret: string, purpose: string, value: string) {
  return toBase64Url(await hmac(secret, `${purpose}:${value}`))
}

export async function verifyToken(secret: string, purpose: string, value: string, token: string) {
  const expected = await signToken(secret, purpose, value)
  if (expected.length !== token.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i)
  return diff === 0
}
