/**
 * Isometric line illustrations for the Viewixsoft CMS capabilities section.
 * Drawn in plain SVG with token classes so they follow light and dark themes.
 * World units map to a 400×300 viewBox; x runs to the lower right, y to the
 * lower left and z straight up. Shapes are listed back to front.
 */
import type { ReactNode } from 'react'
import { LAND_PATH, LAND_PATH_SIZE } from '~/lib/geo/world-land-path'

const COS30 = Math.cos(Math.PI / 6)

function project(x: number, y: number, z: number): [number, number] {
  return [200 + (x - y) * COS30, 150 + (x + y) * 0.5 - z]
}

function pts(...corners: [number, number, number][]) {
  return corners.map(([x, y, z]) => project(x, y, z).join(',')).join(' ')
}

const STROKE = 'stroke-ink-600'

type BoxProps = {
  x: number
  y: number
  z?: number
  w: number
  d: number
  h: number
  /** Fill for the top face, e.g. a gradient url. */
  top?: string
  /** Fill for the front (+y) face, used for screen content. */
  front?: string
}

function Box({ x, y, z = 0, w, d, h, top, front }: BoxProps) {
  const t = z + h
  return (
    <g strokeWidth={1} strokeLinejoin="round" className={STROKE}>
      <polygon
        points={pts([x, y + d, z], [x + w, y + d, z], [x + w, y + d, t], [x, y + d, t])}
        className={front ? undefined : 'fill-ink-900'}
        fill={front}
      />
      <polygon points={pts([x + w, y, z], [x + w, y + d, z], [x + w, y + d, t], [x + w, y, t])} className="fill-ink-850" />
      <polygon
        points={pts([x, y, t], [x + w, y, t], [x + w, y + d, t], [x, y + d, t])}
        className={top ? undefined : 'fill-ink-950'}
        fill={top}
      />
    </g>
  )
}

function Base() {
  return <Box x={-95} y={-95} w={190} d={190} h={6} />
}

function Label({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <text x={x} y={y} textAnchor="middle" className="fill-ink-500 font-mono text-[9px] tracking-[0.14em]">
      {children}
    </text>
  )
}

export function IsoDefs() {
  return (
    <defs>
      <linearGradient id="iso-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" style={{ stopColor: 'var(--color-light-cms)', stopOpacity: 0.9 }} />
        <stop offset="100%" style={{ stopColor: 'var(--color-gradient-from)', stopOpacity: 0.35 }} />
      </linearGradient>
      <linearGradient id="iso-video" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" style={{ stopColor: 'var(--color-gradient-from)' }} />
        <stop offset="100%" style={{ stopColor: 'var(--color-gradient-to)' }} />
      </linearGradient>
      <filter id="pill-shadow" x="-30%" y="-60%" width="160%" height="240%">
        <feDropShadow dx={0} dy={1} stdDeviation={1.2} style={{ floodColor: 'var(--surface-bezel)', floodOpacity: 0.16 }} />
      </filter>
    </defs>
  )
}

/** Draws in the plane of a box's front (+y) face: u runs along x, v runs down. */
function FrontFace({ x, y, top, children }: { x: number; y: number; top: number; children: ReactNode }) {
  const [ox, oy] = project(x, y, top)
  return <g transform={`matrix(${COS30} 0.5 0 1 ${ox} ${oy})`}>{children}</g>
}

/**
 * Cloud drawn as overlapping shapes: a wide stroke pass for the outline, then a
 * fill pass on top that hides the inner seams.
 */
function BigCloud() {
  const shapes = (
    <>
      <rect x={138} y={50} width={124} height={30} rx={15} />
      <circle cx={168} cy={52} r={20} />
      <circle cx={205} cy={40} r={28} />
      <circle cx={240} cy={54} r={18} />
    </>
  )
  return (
    <g className="motion-safe:animate-float">
      <g strokeWidth={2} className="fill-ink-950 stroke-ink-600">
        {shapes}
      </g>
      <g className="fill-ink-950">{shapes}</g>
      {/* Library thumbnails held in the cloud. */}
      <rect x={170} y={50} width={18} height={13} rx={2} fill="url(#iso-sky)" />
      <polygon points="170,63 177,56 181,60 188,63" className="fill-ink-500" />
      <rect x={192} y={50} width={18} height={13} rx={2} fill="url(#iso-video)" />
      <polygon points="199,53.5 199,59.5 204,56.5" style={{ fill: 'var(--color-on-gradient)' }} />
      <rect x={214} y={50} width={18} height={13} rx={2} fill="url(#iso-sky)" />
      <circle cx={227} cy={54} r={2} style={{ fill: 'var(--color-light-pos)' }} />
      <polygon points="214,63 220,57 225,61 232,63" className="fill-ink-500" />
    </g>
  )
}

function PhotoCard() {
  return (
    <g className="motion-safe:animate-float" style={{ animationDelay: '-1.2s' }}>
      <g transform="translate(60 106) rotate(-8)">
        <rect width={62} height={54} rx={4} strokeWidth={1} className="fill-ink-950 stroke-ink-600" />
        <rect x={4} y={4} width={54} height={34} rx={2} fill="url(#iso-sky)" />
        <circle cx={46} cy={13} r={5} style={{ fill: 'var(--color-light-pos)' }} />
        <polygon points="4,38 19,21 28,30 37,22 58,38" className="fill-ink-500" />
        <polygon points="4,38 12,31 20,38" className="fill-ink-600" />
        <text x={6} y={49} className="fill-ink-500 font-mono text-[6.5px]">
          promo.jpg
        </text>
      </g>
    </g>
  )
}

function VideoCard() {
  return (
    <g className="motion-safe:animate-float" style={{ animationDelay: '-2.6s' }}>
      <g transform="translate(270 98) rotate(7)">
        <rect width={70} height={50} rx={4} fill="url(#iso-video)" strokeWidth={1} className="stroke-ink-600" />
        <circle cx={35} cy={21} r={9} style={{ fill: 'var(--color-on-gradient)', fillOpacity: 0.92 }} />
        <polygon points="32,16.5 32,25.5 40,21" style={{ fill: 'var(--color-gradient-via)' }} />
        <rect x={6} y={41} width={58} height={3} rx={1.5} style={{ fill: 'var(--color-on-gradient)', fillOpacity: 0.35 }} />
        <rect x={6} y={41} width={24} height={3} rx={1.5} style={{ fill: 'var(--color-on-gradient)' }} />
        <text x={64} y={37} textAnchor="end" style={{ fill: 'var(--color-on-gradient)' }} className="font-mono text-[6.5px]">
          0:30
        </text>
      </g>
    </g>
  )
}

/** Cloud media library: photos and videos uploaded from a laptop into one cloud library. */
export function SceneCloudMedia() {
  return (
    <g>
      <Base />
      {/* Upload paths from the files to the cloud. */}
      <g fill="none" strokeDasharray="3 3" strokeWidth={1} className="stroke-ink-500">
        <path d="M92 100 C 92 84, 128 80, 150 78" />
        <path d="M306 94 C 306 80, 274 76, 254 74" />
        <path d="M163 110 L 194 84" />
      </g>
      {/* Laptop: base slab, then the open lid showing an upload screen. */}
      <Box x={-40} y={43} z={6} w={80} d={52} h={4} />
      <Box x={-40} y={40} z={10} w={80} d={3} h={48} />
      <FrontFace x={-40} y={43} top={58}>
        <rect x={3} y={3} width={74} height={42} className="fill-ink-950" />
        <rect x={12} y={8} width={56} height={22} rx={2} fill="none" strokeDasharray="2 2" strokeWidth={0.8} className="stroke-ink-500" />
        <g fill="none" strokeWidth={1} strokeLinecap="round" className="stroke-ink-500">
          <line x1={40} y1={25} x2={40} y2={13} />
          <polyline points="35.5,17.5 40,13 44.5,17.5" />
        </g>
        <rect x={12} y={35} width={56} height={3} rx={1.5} className="fill-ink-800" />
        <rect x={12} y={35} width={34} height={3} rx={1.5} fill="url(#iso-video)" />
      </FrontFace>
      <PhotoCard />
      <VideoCard />
      {/* Data drifting up toward the cloud. */}
      {[
        { cx: 104, cy: 86, delay: '0s' },
        { cx: 290, cy: 80, delay: '-0.8s' },
        { cx: 180, cy: 96, delay: '-1.6s' },
      ].map((d) => (
        <circle
          key={d.cx}
          cx={d.cx}
          cy={d.cy}
          r={2}
          className="motion-safe:animate-rise"
          style={{ fill: 'var(--color-gradient-via)', animationDelay: d.delay }}
        />
      ))}
      <BigCloud />
      <Label x={200} y={278}>
        UPLOAD PHOTOS AND VIDEO
      </Label>
    </g>
  )
}

// World map for the remote publishing scene: a dot grid masked by real
// coastlines (Natural Earth 1:110m), drawn as one path plus one pattern.
const MAP_WIDTH = 380
const MAP_SCALE = MAP_WIDTH / LAND_PATH_SIZE.width
const MAP = { x: 10, y: 16, width: MAP_WIDTH, height: LAND_PATH_SIZE.height * MAP_SCALE }

function mapPoint(lon: number, lat: number): [number, number] {
  return [
    MAP.x + (lon + 180) * 2 * MAP_SCALE,
    MAP.y + (LAND_PATH_SIZE.latTop - lat) * 2 * MAP_SCALE,
  ]
}

const CITIES: { name: string; lon: number; lat: number }[] = [
  { name: 'New York', lon: -74, lat: 40.7 },
  { name: 'São Paulo', lon: -46.6, lat: -23.5 },
  { name: 'London', lon: -0.1, lat: 51.5 },
  { name: 'Dubai', lon: 55.3, lat: 25.2 },
  { name: 'Singapore', lon: 103.8, lat: 1.35 },
  { name: 'Tokyo', lon: 139.7, lat: 35.7 },
  { name: 'Sydney', lon: 151.2, lat: -33.9 },
]

/** Top centre of the laptop the content is sent from. */
const ORIGIN: [number, number] = [200, 224]

function MapDefs() {
  return (
    <>
      <pattern id="map-dots" width={2.6} height={2.6} patternUnits="userSpaceOnUse">
        <circle cx={1.3} cy={1.3} r={0.62} className="fill-ink-500" />
      </pattern>
      <mask id="map-land">
        <path d={LAND_PATH} transform={`translate(${MAP.x} ${MAP.y}) scale(${MAP_SCALE})`} fill="white" />
      </mask>
    </>
  )
}

/** City name in a white pill with a play mark: the screen there is showing the upload. */
function CityPill({ x, y, name }: { x: number; y: number; name: string }) {
  const w = 17 + name.length * 3.55
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        x={-w / 2}
        y={-6.5}
        width={w}
        height={13}
        rx={6.5}
        strokeWidth={0.6}
        filter="url(#pill-shadow)"
        className="fill-ink-950 stroke-ink-800"
      />
      <polygon
        points={`${-w / 2 + 5.5},-2.6 ${-w / 2 + 5.5},2.6 ${-w / 2 + 9.8},0`}
        style={{ fill: 'var(--color-gradient-via)' }}
      />
      <text x={-w / 2 + 12} y={2.4} className="fill-ink-50 font-sans text-[6.5px] font-medium">
        {name}
      </text>
    </g>
  )
}

/** Remote publishing: one laptop sends the same content to screens around the world. */
export function SceneRemotePublish() {
  return (
    <g>
      <defs>
        <MapDefs />
      </defs>
      <rect x={MAP.x} y={MAP.y} width={MAP.width} height={MAP.height} fill="url(#map-dots)" mask="url(#map-land)" />

      {CITIES.map((c, ci) => {
        const pin = mapPoint(c.lon, c.lat)
        // A gentle upward bow that never overshoots the pin, like a flight path.
        const ctrl: [number, number] = [(ORIGIN[0] + pin[0]) / 2, (ORIGIN[1] + pin[1]) / 2 - 28]
        const at = (t: number): [number, number] => [
          (1 - t) ** 2 * ORIGIN[0] + 2 * (1 - t) * t * ctrl[0] + t ** 2 * pin[0],
          (1 - t) ** 2 * ORIGIN[1] + 2 * (1 - t) * t * ctrl[1] + t ** 2 * pin[1],
        ]
        return (
          <g key={c.name}>
            <path
              d={`M${ORIGIN[0]} ${ORIGIN[1]} Q ${ctrl[0]} ${ctrl[1]} ${pin[0]} ${pin[1]}`}
              fill="none"
              strokeWidth={0.9}
              strokeLinecap="round"
              style={{ stroke: 'var(--color-gradient-via)', strokeOpacity: 0.55 }}
            />
            {[0.35, 0.6, 0.85].map((t, i) => {
              const [tx, ty] = at(t)
              return (
                <circle
                  key={t}
                  cx={tx}
                  cy={ty}
                  r={1.6}
                  className="motion-safe:animate-travel"
                  style={{ fill: 'var(--color-gradient-via)', animationDelay: `${ci * 0.18 + i * 0.3}s` }}
                />
              )
            })}
          </g>
        )
      })}

      {/* Pins and labels sit on top of every arc. */}
      {CITIES.map((c, ci) => {
        const [px, py] = mapPoint(c.lon, c.lat)
        return (
          <g key={c.name}>
            <circle
              cx={px}
              cy={py}
              r={4.5}
              className="motion-safe:animate-pulse-ring"
              style={{ fill: 'var(--color-gradient-via)', fillOpacity: 0.3, animationDelay: `${ci * 0.3}s` }}
            />
            <circle cx={px} cy={py} r={3.4} style={{ fill: 'var(--color-gradient-via)', fillOpacity: 0.25 }} />
            <circle cx={px} cy={py} r={1.9} style={{ fill: 'var(--color-gradient-via)' }} />
            <CityPill x={px} y={py - 12} name={c.name} />
          </g>
        )
      })}

      {/* Laptop, face-on: the one place everything is published from. */}
      <g transform={`translate(${ORIGIN[0] - 30} ${ORIGIN[1]})`}>
        <rect width={60} height={38} rx={3} strokeWidth={1} className="fill-ink-950 stroke-ink-600" />
        <rect x={4.5} y={4.5} width={51} height={22} rx={1.5} fill="url(#iso-video)" />
        <polygon points="26.5,11 26.5,20 33.5,15.5" style={{ fill: 'var(--color-on-gradient)' }} />
        <rect x={4.5} y={29.5} width={26} height={5} rx={1.5} fill="url(#iso-video)" />
        <text x={17.5} y={33.4} textAnchor="middle" style={{ fill: 'var(--color-on-gradient)' }} className="font-mono text-[4px]">
          PUBLISH
        </text>
        <text x={55.5} y={33.6} textAnchor="end" className="fill-ink-500 font-mono text-[4.5px]">
          YOU
        </text>
        <path d="M-5 38 H65 L60 43 H0 Z" strokeWidth={1} strokeLinejoin="round" className="fill-ink-900 stroke-ink-600" />
      </g>

      <Label x={200} y={290}>
        ONE UPLOAD · EVERY LOCATION
      </Label>
    </g>
  )
}

// Video wall for the synced playback scene: separate screens butted together,
// all playing one video. Panels are 16:9; the picture is drawn once and clipped
// to each panel, so bezels cut through it like a real tiled wall.
const WALL = { x: 62, y: 50, cols: 2, rows: 2, panelW: 138, panelH: 78, bezel: 2.5 }
const WALL_W = WALL.cols * WALL.panelW
const WALL_H = WALL.rows * WALL.panelH

const PANELS = Array.from({ length: WALL.cols * WALL.rows }, (_, i) => ({
  x: WALL.x + (i % WALL.cols) * WALL.panelW,
  y: WALL.y + Math.floor(i / WALL.cols) * WALL.panelH,
}))

/**
 * The one video every panel shows a slice of. It uses brand colours rather than
 * theme tokens, because a video looks the same in light and dark mode.
 */
function WallPicture() {
  const { x, y } = WALL
  const ground = y + WALL_H - 34
  return (
    <>
      <rect x={x} y={y} width={WALL_W} height={WALL_H} fill="url(#iso-sky)" />
      <circle cx={x + 205} cy={y + 46} r={16} style={{ fill: 'var(--color-light-pos)' }} />
      <polygon
        points={`${x},${ground} ${x + 40},${y + 70} ${x + 78},${y + 104} ${x + 120},${y + 58} ${x + 176},${y + 110} ${x + 220},${y + 80} ${x + WALL_W},${y + 112} ${x + WALL_W},${ground}`}
        style={{ fill: 'var(--color-gradient-from)', fillOpacity: 0.55 }}
      />
      <polygon
        points={`${x},${ground} ${x + 60},${y + 104} ${x + 130},${ground - 6} ${x + 190},${y + 100} ${x + WALL_W},${ground}`}
        style={{ fill: 'var(--color-gradient-via)', fillOpacity: 0.8 }}
      />
      <rect x={x} y={ground} width={WALL_W} height={34} style={{ fill: 'var(--surface-bezel)', fillOpacity: 0.9 }} />
      <g strokeDasharray="10 8" strokeWidth={1.5} style={{ stroke: 'var(--color-on-gradient)', strokeOpacity: 0.6 }}>
        <line x1={x} y1={ground + 17} x2={x + WALL_W} y2={ground + 17} />
      </g>
      {/* The bus crosses every panel; it only lines up if the screens play in sync. */}
      <g className="motion-safe:animate-drive">
        <g transform={`translate(${x + WALL_W / 2 - 34} ${ground - 6})`}>
          <rect width={68} height={20} rx={4} fill="url(#iso-video)" />
          {[6, 19, 32, 45].map((wx) => (
            <rect key={wx} x={wx} y={4} width={10} height={7} rx={1.2} style={{ fill: 'var(--color-on-gradient)', fillOpacity: 0.85 }} />
          ))}
          <rect x={58} y={4} width={7} height={11} rx={1.2} style={{ fill: 'var(--color-on-gradient)', fillOpacity: 0.6 }} />
          <circle cx={15} cy={20} r={4} strokeWidth={1.2} style={{ fill: 'var(--surface-bezel)', stroke: 'var(--color-on-gradient)' }} />
          <circle cx={53} cy={20} r={4} strokeWidth={1.2} style={{ fill: 'var(--surface-bezel)', stroke: 'var(--color-on-gradient)' }} />
        </g>
      </g>
    </>
  )
}

/** Synced playback: four separate screens butted together play one video in step. */
export function SceneSyncedWall() {
  const { bezel } = WALL
  return (
    <g>
      <defs>
        <clipPath id="wall-screens">
          {PANELS.map((p) => (
            <rect key={`${p.x}-${p.y}`} x={p.x + bezel} y={p.y + bezel} width={WALL.panelW - bezel * 2} height={WALL.panelH - bezel * 2} />
          ))}
        </clipPath>
      </defs>

      {/* Sync source and its links to the wall. */}
      <g fill="none" strokeDasharray="3 2.5" strokeWidth={0.9} style={{ stroke: 'var(--color-gradient-via)' }}>
        <path d={`M200 30 Q ${WALL.x + WALL.panelW / 2} 30 ${WALL.x + WALL.panelW / 2} ${WALL.y}`} />
        <path d={`M200 30 Q ${WALL.x + WALL.panelW * 1.5} 30 ${WALL.x + WALL.panelW * 1.5} ${WALL.y}`} />
      </g>
      <g transform="translate(200 30)">
        <rect x={-46} y={-8} width={92} height={16} rx={8} strokeWidth={0.7} filter="url(#pill-shadow)" className="fill-ink-950 stroke-ink-800" />
        <circle cx={-36} cy={0} r={2} className="motion-safe:animate-led" style={{ fill: 'var(--color-gradient-via)' }} />
        <text x={-31} y={2.3} className="fill-ink-50 font-sans text-[6.5px] font-medium">
          Viewixsoft CMS · Sync
        </text>
      </g>

      {/* Stand */}
      <g strokeWidth={0.8} className="fill-ink-900 stroke-ink-600">
        <rect x={WALL.x + 70} y={WALL.y + WALL_H - 4} width={7} height={52} />
        <rect x={WALL.x + WALL_W - 77} y={WALL.y + WALL_H - 4} width={7} height={52} />
        <rect x={WALL.x + 52} y={WALL.y + WALL_H + 46} width={43} height={5} rx={2.5} />
        <rect x={WALL.x + WALL_W - 95} y={WALL.y + WALL_H + 46} width={43} height={5} rx={2.5} />
      </g>

      {/* Bezels, then the shared picture clipped to each panel's glass. */}
      {PANELS.map((p) => (
        <rect
          key={`${p.x}-${p.y}`}
          x={p.x}
          y={p.y}
          width={WALL.panelW}
          height={WALL.panelH}
          rx={1.5}
          strokeWidth={0.6}
          className="stroke-ink-700"
          style={{ fill: 'var(--surface-bezel)' }}
        />
      ))}
      <g clipPath="url(#wall-screens)">
        <WallPicture />
      </g>

      {/* Same timecode on every panel: they are all at the same frame. */}
      {PANELS.map((p) => (
        <g key={`tc-${p.x}-${p.y}`} transform={`translate(${p.x + 6} ${p.y + 6})`}>
          <rect width={30} height={8} rx={4} style={{ fill: 'var(--surface-bezel)', fillOpacity: 0.55 }} />
          <text x={15} y={5.6} textAnchor="middle" style={{ fill: 'var(--color-on-gradient)' }} className="font-mono text-[4.5px]">
            00:12:04
          </text>
        </g>
      ))}

      <Label x={200} y={290}>
        4 SCREENS · 1 VIDEO · IN SYNC
      </Label>
    </g>
  )
}

type Slot = { time: string; span: string; title: string; status: 'played' | 'live' | 'scheduled' }

const SLOTS: Slot[] = [
  { time: '08:00', span: '08:00 – 11:00', title: 'Breakfast menu', status: 'played' },
  { time: '12:00', span: '12:00 – 14:00', title: 'Lunch special', status: 'live' },
  { time: '18:00', span: '18:00 – 22:00', title: 'Evening offers', status: 'scheduled' },
]

const CARD = { x: 16, y: 58, w: 170, rowTop: 86, rowH: 46 }
// Portrait 9:16 screen set into a floor-standing enclosure.
const TOTEM = { x: 272, y: 46, w: 86, h: 210 }
const SCREEN = { x: TOTEM.x + 7, y: TOTEM.y + 7, w: 72, h: 128 }

function StatusChip({ status, x, y }: { status: Slot['status']; x: number; y: number }) {
  if (status === 'live') {
    return (
      <g transform={`translate(${x} ${y})`}>
        <rect width={34} height={11} rx={5.5} fill="url(#iso-video)" />
        <circle cx={7} cy={5.5} r={1.8} className="motion-safe:animate-led" style={{ fill: 'var(--color-on-gradient)' }} />
        <text x={11.5} y={7.6} style={{ fill: 'var(--color-on-gradient)' }} className="font-mono text-[5.5px]">
          LIVE
        </text>
      </g>
    )
  }
  const label = status === 'played' ? 'Played' : 'Scheduled'
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        width={34}
        height={11}
        rx={5.5}
        fill="none"
        strokeWidth={0.7}
        strokeDasharray={status === 'scheduled' ? '2 1.5' : undefined}
        className="stroke-ink-700"
      />
      <text x={17} y={7.4} textAnchor="middle" className="fill-ink-500 font-mono text-[5.2px]">
        {label}
      </text>
    </g>
  )
}

/** Analog clock; the minute hand sweeps to show time passing. */
function Clock({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g strokeLinecap="round">
      <circle cx={cx} cy={cy} r={19} strokeWidth={1} filter="url(#pill-shadow)" className="fill-ink-950 stroke-ink-700" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180
        return (
          <line
            key={i}
            x1={cx + Math.sin(a) * 15.5}
            y1={cy - Math.cos(a) * 15.5}
            x2={cx + Math.sin(a) * 17}
            y2={cy - Math.cos(a) * 17}
            strokeWidth={0.8}
            className="stroke-ink-600"
          />
        )
      })}
      <line x1={cx} y1={cy} x2={cx} y2={cy - 9} strokeWidth={1.6} className="stroke-ink-50" />
      <g className="motion-safe:animate-[spin_8s_linear_infinite]" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <line x1={cx} y1={cy} x2={cx} y2={cy - 13.5} strokeWidth={1} style={{ stroke: 'var(--color-gradient-via)' }} />
      </g>
      <circle cx={cx} cy={cy} r={1.6} style={{ fill: 'var(--color-gradient-via)' }} />
    </g>
  )
}

/** Scheduling: when a slot's time comes, the CMS publishes it and the screen plays it. */
export function SceneSchedule() {
  const liveIndex = SLOTS.findIndex((sl) => sl.status === 'live')
  const liveY = CARD.rowTop + liveIndex * CARD.rowH + 20
  const cardH = CARD.rowTop - CARD.y + SLOTS.length * CARD.rowH + 4
  const from: [number, number] = [CARD.x + CARD.w, liveY]
  const to: [number, number] = [TOTEM.x, SCREEN.y + SCREEN.h / 2]
  const ctrl: [number, number] = [(from[0] + to[0]) / 2, Math.min(from[1], to[1]) - 6]
  const at = (t: number): [number, number] => [
    (1 - t) ** 2 * from[0] + 2 * (1 - t) * t * ctrl[0] + t ** 2 * to[0],
    (1 - t) ** 2 * from[1] + 2 * (1 - t) * t * ctrl[1] + t ** 2 * to[1],
  ]

  return (
    <g>
      {/* Today's schedule */}
      <rect
        x={CARD.x}
        y={CARD.y}
        width={CARD.w}
        height={cardH}
        rx={8}
        strokeWidth={0.8}
        filter="url(#pill-shadow)"
        className="fill-ink-950 stroke-ink-800"
      />
      <text x={CARD.x + 10} y={CARD.y + 16} className="fill-ink-50 font-sans text-[7.5px] font-semibold">
        Today
      </text>
      <text x={CARD.x + CARD.w - 10} y={CARD.y + 16} textAnchor="end" className="fill-ink-500 font-mono text-[5.5px]">
        STORE 014 · ALL SCREENS
      </text>
      {SLOTS.map((sl, i) => {
        const top = CARD.rowTop + i * CARD.rowH
        const live = sl.status === 'live'
        return (
          <g key={sl.time} opacity={sl.status === 'played' ? 0.6 : 1}>
            {live && (
              <rect
                x={CARD.x + 4}
                y={top + 1}
                width={CARD.w - 8}
                height={CARD.rowH - 6}
                rx={6}
                strokeWidth={0.8}
                className="fill-signal-950 stroke-signal-800"
              />
            )}
            {i > 0 && !live && SLOTS[i - 1]?.status !== 'live' && (
              <line x1={CARD.x + 10} y1={top - 2} x2={CARD.x + CARD.w - 10} y2={top - 2} strokeWidth={0.6} className="stroke-ink-800" />
            )}
            <text x={CARD.x + 10} y={top + 23} className="fill-ink-500 font-mono text-[6.5px]">
              {sl.time}
            </text>
            <rect x={CARD.x + 36} y={top + 11} width={26} height={17} rx={2} fill="url(#iso-video)" />
            <polygon
              points={`${CARD.x + 47},${top + 16.5} ${CARD.x + 47},${top + 22.5} ${CARD.x + 52},${top + 19.5}`}
              style={{ fill: 'var(--color-on-gradient)' }}
            />
            <text x={CARD.x + 68} y={top + 18} className="fill-ink-50 font-sans text-[7px] font-medium">
              {sl.title}
            </text>
            <text x={CARD.x + 68} y={top + 27} className="fill-ink-500 font-mono text-[5.2px]">
              {sl.span}
            </text>
            <StatusChip status={sl.status} x={CARD.x + CARD.w - 44} y={top + 14} />
          </g>
        )
      })}

      {/* Auto-publish hand-off from the live slot to the screen. */}
      <path
        d={`M${from[0]} ${from[1]} Q ${ctrl[0]} ${ctrl[1]} ${to[0]} ${to[1]}`}
        fill="none"
        strokeWidth={0.9}
        strokeDasharray="3 2.5"
        style={{ stroke: 'var(--color-gradient-via)' }}
      />
      {[0.25, 0.5, 0.75].map((t, i) => {
        const [tx, ty] = at(t)
        return (
          <circle
            key={t}
            cx={tx}
            cy={ty}
            r={1.7}
            className="motion-safe:animate-travel"
            style={{ fill: 'var(--color-gradient-via)', animationDelay: `${i * 0.3}s` }}
          />
        )
      })}
      <text x={(from[0] + to[0]) / 2} y={ctrl[1] - 6} textAnchor="middle" className="fill-ink-500 font-mono text-[5px] tracking-[0.12em]">
        AUTO-PUBLISH
      </text>

      <Clock cx={226} cy={40} />

      {/* Floor-standing advertising display (9:16 portrait), playing the live slot as a poster. */}
      <rect
        x={TOTEM.x}
        y={TOTEM.y}
        width={TOTEM.w}
        height={TOTEM.h}
        rx={6}
        strokeWidth={0.8}
        filter="url(#pill-shadow)"
        className="stroke-ink-700"
        style={{ fill: 'var(--surface-bezel)' }}
      />
      <rect x={TOTEM.x - 8} y={TOTEM.y + TOTEM.h} width={TOTEM.w + 16} height={6} rx={3} strokeWidth={0.8} className="fill-ink-900 stroke-ink-600" />
      {/* Speaker grille on the lower body. */}
      <g style={{ fill: 'var(--color-on-gradient)', fillOpacity: 0.18 }}>
        {Array.from({ length: 3 }, (_, row) =>
          Array.from({ length: 9 }, (_, col) => (
            <circle key={`${row}-${col}`} cx={TOTEM.x + 22 + col * 5} cy={SCREEN.y + SCREEN.h + 26 + row * 5} r={0.9} />
          )),
        )}
      </g>
      <rect x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx={2} fill="url(#iso-video)" />
      <g transform={`translate(${SCREEN.x + 5} ${SCREEN.y + 6})`}>
        <rect width={33} height={9} rx={4.5} style={{ fill: 'var(--color-on-gradient)', fillOpacity: 0.22 }} />
        <circle cx={5.5} cy={4.5} r={1.6} className="motion-safe:animate-led" style={{ fill: 'var(--color-on-gradient)' }} />
        <text x={9.5} y={6.4} style={{ fill: 'var(--color-on-gradient)' }} className="font-mono text-[4.5px]">
          PLAYING
        </text>
      </g>
      {/* Dish: plate, food and a garnish. */}
      <circle cx={SCREEN.x + SCREEN.w / 2} cy={SCREEN.y + 44} r={21} style={{ fill: 'var(--color-on-gradient)', fillOpacity: 0.16 }} />
      <circle cx={SCREEN.x + SCREEN.w / 2} cy={SCREEN.y + 44} r={15} style={{ fill: 'var(--color-on-gradient)', fillOpacity: 0.9 }} />
      <circle cx={SCREEN.x + SCREEN.w / 2 - 3} cy={SCREEN.y + 42} r={7} style={{ fill: 'var(--color-light-pos)' }} />
      <circle cx={SCREEN.x + SCREEN.w / 2 + 5} cy={SCREEN.y + 48} r={4} style={{ fill: 'var(--color-light-tracking)' }} />
      <text x={SCREEN.x + 6} y={SCREEN.y + 82} style={{ fill: 'var(--color-on-gradient)' }} className="font-sans text-[10px] font-semibold">
        Lunch
      </text>
      <text x={SCREEN.x + 6} y={SCREEN.y + 93} style={{ fill: 'var(--color-on-gradient)' }} className="font-sans text-[10px] font-semibold">
        special
      </text>
      <text x={SCREEN.x + 6} y={SCREEN.y + 102} style={{ fill: 'var(--color-on-gradient)', fillOpacity: 0.8 }} className="font-mono text-[4.8px]">
        {SLOTS[liveIndex]?.span}
      </text>
      <rect x={SCREEN.x + 6} y={SCREEN.y + 107} width={34} height={9} rx={4.5} style={{ fill: 'var(--color-on-gradient)' }} />
      <text x={SCREEN.x + 23} y={SCREEN.y + 113} textAnchor="middle" style={{ fill: 'var(--color-gradient-via)' }} className="font-sans text-[4.8px] font-semibold">
        Order now
      </text>
      <rect x={SCREEN.x + 6} y={SCREEN.y + SCREEN.h - 6} width={SCREEN.w - 12} height={1.6} rx={0.8} style={{ fill: 'var(--color-on-gradient)', fillOpacity: 0.3 }} />
      <rect x={SCREEN.x + 6} y={SCREEN.y + SCREEN.h - 6} width={24} height={1.6} rx={0.8} style={{ fill: 'var(--color-on-gradient)' }} />

      <Label x={200} y={290}>
        PUBLISHES ON TIME · PLAYS ON ITS OWN
      </Label>
    </g>
  )
}

// Device report scene: a fleet dashboard. Figures are illustrative UI only.
const REPORT = { x: 18, y: 16, w: 364, h: 252 }

const KPIS: { label: string; value: string; dot?: string }[] = [
  { label: 'ONLINE', value: '142', dot: 'var(--color-light-tracking)' },
  { label: 'OFFLINE', value: '3', dot: 'var(--color-alert)' },
  { label: 'PLAYING ON SCHEDULE', value: '96%' },
]

const DAYS: { day: string; online: number }[] = [
  { day: 'M', online: 0.82 },
  { day: 'T', online: 0.9 },
  { day: 'W', online: 0.86 },
  { day: 'T', online: 0.94 },
  { day: 'F', online: 0.97 },
  { day: 'S', online: 0.91 },
  { day: 'S', online: 0.98 },
]

const DEVICES: { name: string; place: string; online: boolean; seen: string }[] = [
  { name: 'Lobby totem', place: 'Store 014', online: true, seen: 'Now' },
  { name: 'Menu board 2', place: 'Store 021', online: true, seen: 'Now' },
  { name: 'Window display', place: 'Store 007', online: false, seen: '2h ago' },
]

/** Device health report: one overview of every screen's status, uptime and playback. */
export function SceneDeviceReport() {
  const { x, y, w, h } = REPORT
  const pad = 12
  const kpiW = (w - pad * 2 - 16) / 3
  const chart = { x: x + pad, y: y + 86, w: 210, h: 82 }
  const donut = { cx: x + w - 64, cy: chart.y + 40, r: 26 }
  const share = 0.96
  const circumference = 2 * Math.PI * donut.r
  const barGap = 8
  const barW = (chart.w - barGap * (DAYS.length - 1)) / DAYS.length
  const plotH = chart.h - 30

  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} strokeWidth={0.8} filter="url(#pill-shadow)" className="fill-ink-950 stroke-ink-800" />
      <text x={x + pad} y={y + 20} className="fill-ink-50 font-sans text-[8px] font-semibold">
        Device overview
      </text>
      <g transform={`translate(${x + w - pad - 44} ${y + 11})`}>
        <rect width={44} height={12} rx={6} strokeWidth={0.6} className="fill-ink-900 stroke-ink-800" />
        <text x={22} y={8} textAnchor="middle" className="fill-ink-500 font-mono text-[5px]">
          LAST 7 DAYS
        </text>
      </g>

      {/* KPI tiles */}
      {KPIS.map((k, i) => {
        const kx = x + pad + i * (kpiW + 8)
        return (
          <g key={k.label}>
            <rect x={kx} y={y + 32} width={kpiW} height={42} rx={5} strokeWidth={0.6} className="fill-ink-900 stroke-ink-800" />
            {k.dot && (
              <circle cx={kx + 9} cy={y + 43} r={2.2} className={k.label === 'OFFLINE' ? 'motion-safe:animate-led' : undefined} style={{ fill: k.dot }} />
            )}
            <text x={kx + (k.dot ? 14 : 8)} y={y + 45} className="fill-ink-500 font-mono text-[5px]">
              {k.label}
            </text>
            <text x={kx + 8} y={y + 66} className="fill-ink-50 font-sans text-[15px] font-semibold">
              {k.value}
            </text>
          </g>
        )
      })}

      {/* Screens online per day */}
      <text x={chart.x} y={chart.y + 8} className="fill-ink-500 font-mono text-[5.5px]">
        SCREENS ONLINE
      </text>
      <line x1={chart.x} y1={chart.y + 14 + plotH} x2={chart.x + chart.w} y2={chart.y + 14 + plotH} strokeWidth={0.6} className="stroke-ink-800" />
      {DAYS.map((d, i) => {
        const bh = plotH * d.online
        const bx = chart.x + i * (barW + barGap)
        const today = i === DAYS.length - 1
        return (
          <g key={i}>
            <rect
              x={bx}
              y={chart.y + 14 + plotH - bh}
              width={barW}
              height={bh}
              rx={2}
              fill="url(#iso-video)"
              opacity={today ? 1 : 0.45}
            />
            <text x={bx + barW / 2} y={chart.y + 14 + plotH + 9} textAnchor="middle" className="fill-ink-500 font-mono text-[5px]">
              {d.day}
            </text>
          </g>
        )
      })}

      {/* Playback on schedule */}
      <text x={donut.cx} y={chart.y + 8} textAnchor="middle" className="fill-ink-500 font-mono text-[5.5px]">
        PLAYBACK
      </text>
      <circle cx={donut.cx} cy={donut.cy + 6} r={donut.r} fill="none" strokeWidth={7} className="stroke-ink-800" />
      <circle
        cx={donut.cx}
        cy={donut.cy + 6}
        r={donut.r}
        fill="none"
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray={`${circumference * share} ${circumference}`}
        transform={`rotate(-90 ${donut.cx} ${donut.cy + 6})`}
        style={{ stroke: 'var(--color-gradient-via)' }}
      />
      <text x={donut.cx} y={donut.cy + 8} textAnchor="middle" className="fill-ink-50 font-sans text-[10px] font-semibold">
        96%
      </text>
      <text x={donut.cx} y={donut.cy + 16} textAnchor="middle" className="fill-ink-500 font-mono text-[4.5px]">
        ON SCHEDULE
      </text>

      {/* Device list */}
      {DEVICES.map((d, i) => {
        const ry = y + 180 + i * 22
        return (
          <g key={d.name}>
            <line x1={x + pad} y1={ry - 4} x2={x + w - pad} y2={ry - 4} strokeWidth={0.6} className="stroke-ink-800" />
            <circle
              cx={x + pad + 4}
              cy={ry + 8}
              r={2.4}
              className={d.online ? undefined : 'motion-safe:animate-led'}
              style={{ fill: d.online ? 'var(--color-light-tracking)' : 'var(--color-alert)' }}
            />
            <text x={x + pad + 12} y={ry + 7} className="fill-ink-50 font-sans text-[6.5px] font-medium">
              {d.name}
            </text>
            <text x={x + pad + 12} y={ry + 14} className="fill-ink-500 font-mono text-[4.8px]">
              {d.place}
            </text>
            <text x={x + 200} y={ry + 10} className="fill-ink-500 font-mono text-[5px]">
              {d.online ? 'ONLINE' : 'OFFLINE'}
            </text>
            <text x={x + w - pad} y={ry + 10} textAnchor="end" className="fill-ink-500 font-mono text-[5px]">
              {d.seen}
            </text>
          </g>
        )
      })}

      <Label x={200} y={290}>
        EVERY DEVICE · ONE REPORT
      </Label>
    </g>
  )
}
