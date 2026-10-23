export function StatsStrip() {
  const stats = [
    { value: '50,000+', label: 'Commercial Displays Powered', detail: 'Running 24/7 across 5 continents' },
    { value: '99.99%', label: 'Network Playback SLA', detail: 'Backed by local edge caching' },
    { value: '< 250ms', label: 'POS & Screen Sync Latency', detail: 'Real-time WebSocket event bus' },
    { value: '45+', label: 'Countries Deployed', detail: 'Compliant with GDPR & international laws' }
  ]

  return (
    <section className="py-20 border-y border-ink-900 bg-ink-950/80 relative">
      <div className="page-x">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="p-6 rounded-2xl panel border border-ink-800 text-center space-y-2">
              <div className="text-4xl sm:text-5xl font-black bg-signal-400 font-mono">
                {stat.value}
              </div>
              <div className="text-sm font-bold text-ink-50 tracking-wide">
                {stat.label}
              </div>
              <div className="text-xs text-ink-400">
                {stat.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
