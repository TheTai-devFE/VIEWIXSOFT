export function LogoCloud() {
  const hardwarePartners = [
    { name: 'Samsung Tizen', type: 'Certified SoC' },
    { name: 'LG webOS Signage', type: 'Certified SoC' },
    { name: 'BrightSign OS', type: 'Hardware Partner' },
    { name: 'Windows IoT', type: 'Native Runtime' },
    { name: 'Android Industrial', type: 'OEM Verified' },
    { name: 'Raspberry Pi Foundation', type: 'Edge Supported' }
  ]

  return (
    <section className="py-12 border-y border-ink-900 bg-ink-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-ink-500 mb-8">
          Pre-Certified & Native Across Commercial Hardware & SoC Platforms
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 items-center">
          {hardwarePartners.map((partner, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-ink-900 hover:border-ink-800 bg-ink-900/30 hover:bg-ink-900/60 transition-all text-center group"
            >
              <span className="font-bold text-sm text-ink-300 group-hover:text-signal-400 transition-colors">
                {partner.name}
              </span>
              <span className="text-[10px] text-ink-500 font-mono">
                {partner.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
