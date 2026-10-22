import { useEffect, useState } from 'react'
import { Floating3DParticles } from '~/components/ui/floating-3d-particles'

/**
 * Magic UI floating particles tinted with the theme's `--signal` token.
 * The canvas API needs a literal color, so the token is resolved in the browser
 * and re-read when the `dark` class on <html> flips.
 */
export function ParticlesBackground() {
  const [color, setColor] = useState<string | null>(null)

  useEffect(() => {
    const root = document.documentElement
    const read = () => setColor(getComputedStyle(root).getPropertyValue('--signal').trim() || null)
    read()
    const observer = new MutationObserver(read)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Nothing on the server or before the token is known, so the library's
  // default purple never flashes.
  if (!color) return null

  return (
    <>
      <Floating3DParticles color={color} quantity={350} size={4} opacity={0.5} drift={0.4} depth={0.8} />
      {/* Fades the field toward the edges so the headline keeps its contrast. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--surface-room)_95%)]"
      />
    </>
  )
}
