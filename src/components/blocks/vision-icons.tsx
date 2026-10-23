import { useId } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '~/lib/cn'

/*
 * Glowing wireframe objects for the About vision cards, drawn in SVG with the
 * brand gradient so they need no image files and follow the tokens. Each
 * shape is drawn twice: a blurred copy for the glow, a sharp copy on top.
 * Every icon plays its entrance once its card is revealed (the card is a
 * `group/card`); `delay` lines it up after the card's own rise.
 */

// Whole class names, so Tailwind can see them.
const pop = 'motion-safe:group-data-[reveal=shown]/card:animate-vision-pop'
const grow = 'motion-safe:group-data-[reveal=shown]/card:animate-vision-grow'
const slide = 'motion-safe:group-data-[reveal=shown]/card:animate-vision-slide'

function Frame({ children }: { children: (ids: { stroke: string; fill: string; glow: string }) => ReactNode }) {
  const base = useId().replace(/:/g, '')
  const ids = { stroke: `${base}-stroke`, fill: `${base}-fill`, glow: `${base}-glow` }
  return (
    // Decorative: the card title says what it shows.
    <svg viewBox="0 0 200 140" aria-hidden="true" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id={ids.stroke} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" style={{ stopColor: 'var(--color-light-cms)' }} />
          <stop offset="50%" style={{ stopColor: 'var(--color-gradient-via)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--color-gradient-to)' }} />
        </linearGradient>
        <radialGradient id={ids.fill}>
          <stop offset="0%" style={{ stopColor: 'var(--color-signal-200)', stopOpacity: 0.95 }} />
          <stop offset="45%" style={{ stopColor: 'var(--color-gradient-via)', stopOpacity: 0.55 }} />
          <stop offset="100%" style={{ stopColor: 'var(--color-gradient-to)', stopOpacity: 0 }} />
        </radialGradient>
        <filter id={ids.glow} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>
      {children(ids)}
    </svg>
  )
}

/** Draws `shape` blurred underneath (the glow) and sharp on top. */
function Glow({ glow, children }: { glow: string; children: ReactNode }) {
  return (
    <>
      <g filter={`url(#${glow})`} opacity={0.75}>
        {children}
      </g>
      {children}
    </>
  )
}

const after = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` })

/** Concentric radar rings around a glowing orb, with a contact on the outer ring. */
export function SignalsIcon({ delay = 0 }: { delay?: number }) {
  return (
    <Frame>
      {({ stroke, fill, glow }) => (
        <g className={pop} style={after(delay)}>
          <Glow glow={glow}>
            <g fill="none" stroke={`url(#${stroke})`} strokeWidth={1}>
              <ellipse cx="100" cy="82" rx="82" ry="28" opacity={0.45} />
              <ellipse cx="100" cy="82" rx="60" ry="20" opacity={0.7} />
              <ellipse cx="100" cy="82" rx="38" ry="13" />
              <path d="M18 82h164M100 54v56" strokeDasharray="2 4" opacity={0.4} />
            </g>
            <circle cx="176" cy="71" r="3" fill="var(--color-signal-200)" />
          </Glow>
          <circle cx="100" cy="72" r="24" fill={`url(#${fill})`} />
          <circle cx="100" cy="72" r="7" fill="var(--color-signal-100)" filter={`url(#${glow})`} />
          <circle cx="100" cy="72" r="4" fill="var(--color-signal-50)" />
        </g>
      )}
    </Frame>
  )
}

const BARS = [
  { x: 30, h: 34 },
  { x: 48, h: 56 },
  { x: 66, h: 44 },
  { x: 84, h: 70 },
]

/** Thin glowing bar cylinders beside two overlapping wireframe spheres, three dashes above. */
export function InsightsIcon({ delay = 0 }: { delay?: number }) {
  return (
    <Frame>
      {({ stroke, fill, glow }) => (
        <Glow glow={glow}>
          <g fill="none" stroke={`url(#${stroke})`} strokeWidth={1}>
            {BARS.map((b, i) => (
              <g key={b.x} className={grow} style={after(delay + i * 90)}>
                <rect x={b.x} y={116 - b.h} width="9" height={b.h} fill={`url(#${fill})`} fillOpacity={0.35} />
                <ellipse cx={b.x + 4.5} cy={116 - b.h} rx="4.5" ry="1.8" />
              </g>
            ))}
            <g className={pop} style={after(delay + 200)}>
              <circle cx="140" cy="70" r="28" />
              <ellipse cx="140" cy="70" rx="28" ry="10" opacity={0.7} />
              <ellipse cx="140" cy="70" rx="11" ry="28" opacity={0.7} />
              <circle cx="162" cy="88" r="19" opacity={0.6} />
              <ellipse cx="162" cy="88" rx="19" ry="7" opacity={0.45} />
            </g>
            <path d="M118 26h10M134 22h10M150 26h10" strokeLinecap="round" className={pop} style={after(delay + 320)} />
          </g>
        </Glow>
      )}
    </Frame>
  )
}

/** A stack of translucent document sheets with lines of text. */
export function ReportsIcon({ delay = 0 }: { delay?: number }) {
  return (
    <Frame>
      {({ stroke, fill, glow }) => (
        <Glow glow={glow}>
          {[0, 1, 2].map((i) => {
            const x = 52 + i * 20
            const y = 22 + i * 14
            return (
              <g key={i} className={slide} style={after(delay + i * 110)} opacity={0.45 + i * 0.25}>
                <path
                  d={`M${x} ${y}h62l12 10v66h-74z`}
                  fill={`url(#${fill})`}
                  fillOpacity={0.12}
                  stroke={`url(#${stroke})`}
                  strokeWidth={1}
                />
                <path
                  d={`M${x + 10} ${y + 20}h40M${x + 10} ${y + 30}h50M${x + 10} ${y + 40}h32M${x + 10} ${y + 50}h46`}
                  stroke={`url(#${stroke})`}
                  strokeWidth={1}
                  strokeLinecap="round"
                  opacity={0.8}
                />
              </g>
            )
          })}
        </Glow>
      )}
    </Frame>
  )
}

export const VISION_ICONS = [SignalsIcon, InsightsIcon, ReportsIcon]

/** Soft round fade around an icon so its glow never ends in a hard edge. */
export function IconStage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('[mask-image:radial-gradient(closest-side,black_70%,transparent)]', className)}>{children}</div>
  )
}
