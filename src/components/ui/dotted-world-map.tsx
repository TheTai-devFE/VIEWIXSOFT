import { useId } from 'react'
import { LAND_PATH, LAND_PATH_SIZE } from '~/lib/geo/world-land-path'
import { cn } from '~/lib/cn'

/**
 * Dot-matrix world map after Magic UI's "Dotted Map", drawn from the land
 * outline already in ~/lib/geo (Natural Earth, public domain) instead of the
 * `svg-dotted-map` package. Dots and markers take token colours, so it follows
 * the theme. Decorative: describe what it shows in the surrounding text.
 */
export interface MapMarker {
  lon: number
  lat: number
  /** Shown beside the marker. */
  label?: string
}

const { width: W, height: H, latTop } = LAND_PATH_SIZE
const project = (lon: number, lat: number): [number, number] => [(lon + 180) * 2, (latTop - lat) * 2]

export function DottedWorldMap({
  markers = [],
  className,
  dotGap = 6,
}: {
  markers?: MapMarker[]
  className?: string
  /** Distance between dots in map units (the map is 720 wide). */
  dotGap?: number
}) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className={cn('h-auto w-full', className)}>
      <defs>
        <pattern id={`${id}-dots`} width={dotGap} height={dotGap} patternUnits="userSpaceOnUse">
          <circle cx={dotGap / 2} cy={dotGap / 2} r={dotGap * 0.24} className="fill-ink-600" />
        </pattern>
        <mask id={`${id}-land`}>
          <path d={LAND_PATH} fill="white" />
        </mask>
        {/* Land drawn twice across the antimeridian stays inside the map. */}
        <clipPath id={`${id}-clip`}>
          <rect width={W} height={H} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <rect width={W} height={H} fill={`url(#${id}-dots)`} mask={`url(#${id}-land)`} />
      </g>
      {markers.map((m) => {
        const [x, y] = project(m.lon, m.lat)
        return (
          <g key={`${m.lon},${m.lat}`}>
            <circle cx={x} cy={y} r={7} className="fill-signal-500/30 motion-safe:animate-pulse-ring" />
            <circle cx={x} cy={y} r={5} className="fill-signal-500" />
            {m.label && (
              <text x={x + 12} y={y + 4} className="fill-ink-200 font-mono text-[13px] font-medium">
                {m.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
