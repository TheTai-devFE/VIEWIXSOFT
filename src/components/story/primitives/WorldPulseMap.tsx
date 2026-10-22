import { m, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { LAND, insideLand } from '~/lib/geo/world-land'
import type { LonLat } from '~/lib/geo/world-land'

const W = 360
const H = 150
const LAT_TOP = 80
const LAT_BOTTOM = -58
const project = ([lon, lat]: LonLat) => ({
  x: ((lon + 180) / 360) * W,
  y: ((LAT_TOP - lat) / (LAT_TOP - LAT_BOTTOM)) * H,
})

const STEP = 4
const DOTS: { x: number; y: number }[] = []
for (let lat = LAT_TOP; lat >= LAT_BOTTOM; lat -= STEP) {
  for (let lon = -178; lon <= 180; lon += STEP) {
    if (LAND.some((p) => insideLand([lon, lat], p))) DOTS.push(project([lon, lat]))
  }
}

const NODES = [
  { id: 'NYC', at: project([-74, 40.7]) },
  { id: 'TOR', at: project([-79.4, 43.7]) },
  { id: 'LAX', at: project([-118.2, 34]) },
  { id: 'GRU', at: project([-46.6, -23.5]) },
  { id: 'LON', at: project([-0.1, 51.5]) },
  { id: 'FRA', at: project([8.7, 50.1]) },
  { id: 'DXB', at: project([55.3, 25.2]) },
  { id: 'SIN', at: project([103.8, 1.35]) },
  { id: 'TYO', at: project([139.7, 35.7]) },
  { id: 'SYD', at: project([151.2, -33.9]) },
]
const ORIGIN = NODES[0]?.at ?? { x: 0, y: 0 }

const LOG = [
  '[23:01:42.108] NODE_US_NYC_042 :: FRAME_RENDER_OK   :: SHA256 7f8a…c9e1',
  '[23:01:42.194] NODE_UK_LON_119 :: AD_PLAY_VERIFIED  :: CAMPAIGN #4092',
  '[23:01:42.240] NODE_JP_TYO_008 :: PANEL_HEALTH_100% :: TEMP 41°C',
  '[23:01:42.317] NODE_SG_SIN_221 :: FRAME_RENDER_OK   :: SHA256 03bd…71aa',
  '[23:01:42.402] NODE_AE_DXB_015 :: AD_PLAY_VERIFIED  :: CAMPAIGN #4092',
  '[23:01:42.488] NODE_AU_SYD_063 :: HEARTBEAT_OK      :: UPTIME 41d',
  '[23:01:42.561] NODE_BR_GRU_310 :: FRAME_RENDER_OK   :: SHA256 e41c…9f02',
]

const RING = 2 * Math.PI * 26

/**
 * Chapter 5: the camera pulls back from one screen to a world of heartbeat
 * nodes, then the proof-of-play log streams in.
 * Progress windows: 0–0.3 pull back · 0.3–0.6 nodes · 0.55–0.95 log + health ring.
 */
export function WorldPulseMap({ progress }: { progress: MotionValue<number> }) {
  const zoom = useTransform(progress, [0, 0.3], [3, 1])
  const screenScale = useTransform(progress, [0, 0.28], [1, 0.05])
  const screenOpacity = useTransform(progress, [0.22, 0.3], [1, 0])
  const ring = useTransform(progress, [0.6, 0.95], [RING, RING * (1 - 0.9998)])
  const health = useTransform(progress, [0.6, 0.95], [0, 99.98], { clamp: true })
  const healthLabel = useTransform(health, (v) => `${v.toFixed(2)}%`)

  return (
    <div className="flex h-full w-full flex-col gap-3 rounded-lg border border-ink-800 bg-ink-950 p-3 sm:p-4">
      <div className="relative min-h-0 flex-[3] overflow-hidden">
        <m.svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-full w-full"
          preserveAspectRatio="xMidYMid meet"
          style={{ scale: zoom, transformOrigin: `${(ORIGIN.x / W) * 100}% ${(ORIGIN.y / H) * 100}%` }}
        >
          <g className="fill-ink-700">
            {DOTS.map((d) => (
              <circle key={`${d.x}-${d.y}`} cx={d.x} cy={d.y} r={0.9} />
            ))}
          </g>
          {NODES.map((n, i) => (
            <Node key={n.id} progress={progress} x={n.at.x} y={n.at.y} start={0.3 + i * 0.028} label={n.id} />
          ))}
          <m.rect
            x={ORIGIN.x - 8}
            y={ORIGIN.y - 5}
            width={16}
            height={10}
            rx={0.6}
            className="fill-ink-900 stroke-light-tracking"
            strokeWidth={0.4}
            style={{ scale: screenScale, opacity: screenOpacity, transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        </m.svg>
      </div>

      <div className="flex min-h-0 flex-[2] gap-3">
        <div className="min-w-0 flex-1 overflow-hidden rounded-md border border-ink-800 bg-ink-900 p-2 font-mono text-[7px] leading-relaxed text-ink-400 sm:text-[9px]">
          <p className="mb-1 uppercase tracking-[0.14em] text-light-tracking">Proof-of-play · live</p>
          {LOG.map((line, i) => (
            <LogLine key={line} progress={progress} start={0.55 + i * 0.05}>
              {line}
            </LogLine>
          ))}
        </div>
        <div className="flex w-[28%] shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-ink-800 bg-ink-900 p-2">
          <svg viewBox="0 0 64 64" className="h-14 w-14 -rotate-90 sm:h-20 sm:w-20">
            <circle cx="32" cy="32" r="26" className="fill-none stroke-ink-800" strokeWidth="5" />
            <m.circle
              cx="32"
              cy="32"
              r="26"
              className="fill-none stroke-light-tracking"
              strokeWidth="5"
              strokeDasharray={RING}
              style={{ strokeDashoffset: ring }}
            />
          </svg>
          <m.span className="font-mono text-xs text-ink-50 sm:text-sm">{healthLabel}</m.span>
          <span className="text-center font-mono text-[7px] uppercase tracking-[0.14em] text-ink-400 sm:text-[9px]">Fleet health</span>
        </div>
      </div>
    </div>
  )
}

function Node({ progress, x, y, start, label }: { progress: MotionValue<number>; x: number; y: number; start: number; label: string }) {
  const opacity = useTransform(progress, [start, start + 0.03], [0, 1])
  return (
    <m.g style={{ opacity }}>
      <circle cx={x} cy={y} r={2.2} className="animate-pulse-ring fill-none stroke-light-tracking" strokeWidth={0.4} />
      <circle cx={x} cy={y} r={1.6} className="fill-light-tracking" />
      <text x={x + 3} y={y - 2.5} className="fill-ink-400 font-mono text-[4px]">
        {label}
      </text>
    </m.g>
  )
}

function LogLine({ progress, start, children }: { progress: MotionValue<number>; start: number; children: string }) {
  const opacity = useTransform(progress, [start, start + 0.02], [0, 1])
  return (
    <m.p style={{ opacity }} className="truncate whitespace-pre">
      {children}
    </m.p>
  )
}
