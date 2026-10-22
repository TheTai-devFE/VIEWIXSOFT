/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Cloudflare Turnstile site key; inlined at build time, safe to expose. */
  readonly VITE_PUBLIC_TURNSTILE_SITE_KEY?: string
  /** Set to "true" when Cloudflare Image Transformations are enabled on the zone. */
  readonly VITE_PUBLIC_IMAGE_TRANSFORMS?: string
}
