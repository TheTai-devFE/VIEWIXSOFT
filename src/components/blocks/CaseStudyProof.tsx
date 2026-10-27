import { CaseStudySection } from '~/components/blocks/CaseStudySection'
import type { CaseStudyMode, CaseStudyResult } from '~/lib/case-study'

/**
 * Measured results, only on an approved customer story. Each figure carries
 * the value before (when known), the period and how it was measured.
 */
export function CaseStudyProof({ mode, results }: { mode: CaseStudyMode; results: CaseStudyResult[] }) {
  if (mode !== 'story' || results.length === 0) return null
  return (
    <CaseStudySection id="results" eyebrow="Results" title="What changed after the rollout?">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {results.map((r) => (
          <li key={r.label} className="space-y-2 rounded-2xl border border-ink-800 bg-ink-900/60 p-6">
            <p className="font-mono text-4xl font-extrabold tracking-tight text-signal-400 tabular-nums">{r.metric}</p>
            <p className="font-medium text-ink-100">{r.label}</p>
            {r.baseline && <p className="text-sm text-ink-400">Before: {r.baseline}</p>}
            <p className="font-mono text-xs text-ink-500">{[r.period, r.source].filter(Boolean).join(' · ')}</p>
          </li>
        ))}
      </ul>
    </CaseStudySection>
  )
}
