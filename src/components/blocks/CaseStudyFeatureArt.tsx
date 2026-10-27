/**
 * Decorative line art behind a product card, one motif per product so the
 * cards tell apart at a glance: waves for content (CMS), a price grid (POS),
 * a device network (Tracking), tap ripples (NFC), a screen wall (hardware).
 * Coordinates are fixed so server and client render the same SVG.
 */
export type ArtMotif = 'waves' | 'grid' | 'network' | 'ripples' | 'wall'

export function motifFor(productSlug: string | null): ArtMotif {
  switch (productSlug) {
    case 'cms':
      return 'waves'
    case 'pos':
      return 'grid'
    case 'tracking':
      return 'network'
    case 'nfc':
      return 'ripples'
    default:
      return 'wall'
  }
}

const NODES: [number, number][] = [
  [250, 40], [300, 90], [340, 60], [380, 130], [300, 170], [230, 120], [360, 210], [270, 230], [400, 80], [200, 200],
]
const EDGES: [number, number][] = [
  [0, 1], [1, 2], [1, 3], [1, 4], [4, 5], [3, 6], [4, 7], [2, 8], [5, 9], [6, 7], [3, 8], [0, 5],
]

export function CaseStudyFeatureArt({ motif }: { motif: ArtMotif }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 420 260" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" fill="none">
      {motif === 'waves' &&
        Array.from({ length: 7 }, (_, i) => (
          <path
            key={i}
            d={`M0 ${70 + i * 18} C 90 ${30 + i * 22}, 160 ${130 + i * 10}, 250 ${80 + i * 16} S 380 ${40 + i * 20}, 420 ${90 + i * 14}`}
            stroke="currentColor"
            strokeOpacity={0.15 + (i % 3) * 0.12}
            strokeWidth={1.25}
          />
        ))}
      {motif === 'grid' && (
        <>
          {Array.from({ length: 11 }, (_, i) => (
            <line key={`v${i}`} x1={i * 42} y1={0} x2={i * 42} y2={260} stroke="currentColor" strokeOpacity={0.08} />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 42} x2={420} y2={i * 42} stroke="currentColor" strokeOpacity={0.08} />
          ))}
          {[
            [84, 70, 150],
            [210, 40, 120],
            [294, 90, 210],
            [378, 60, 180],
          ].map(([x, y1, y2]) => (
            <line key={x} x1={x} y1={y1} x2={x} y2={y2} stroke="currentColor" strokeOpacity={0.7} strokeWidth={2} strokeLinecap="round" />
          ))}
          <line x1={150} y1={56} x2={240} y2={56} stroke="currentColor" strokeOpacity={0.5} strokeWidth={2} strokeLinecap="round" />
          <line x1={250} y1={140} x2={330} y2={140} stroke="currentColor" strokeOpacity={0.5} strokeWidth={2} strokeLinecap="round" />
        </>
      )}
      {motif === 'network' && (
        <>
          {EDGES.map(([a, b]) => {
            const [x1, y1] = NODES[a] ?? [0, 0]
            const [x2, y2] = NODES[b] ?? [0, 0]
            return <line key={`${a}-${b}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeOpacity={0.35} />
          })}
          {NODES.map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 4 : 2.5} fill="currentColor" fillOpacity={0.8} />
          ))}
        </>
      )}
      {motif === 'ripples' &&
        Array.from({ length: 6 }, (_, i) => (
          <circle key={i} cx={330} cy={90} r={22 + i * 28} stroke="currentColor" strokeOpacity={0.55 - i * 0.08} strokeWidth={1.25} />
        ))}
      {motif === 'wall' &&
        Array.from({ length: 3 }, (_, row) =>
          Array.from({ length: 3 }, (_, col) => (
            <rect
              key={`${row}-${col}`}
              x={210 + col * 64}
              y={30 + row * 40}
              width={58}
              height={34}
              rx={3}
              stroke="currentColor"
              strokeOpacity={0.3 + ((row + col) % 2) * 0.2}
            />
          )),
        )}
    </svg>
  )
}
