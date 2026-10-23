import { Link } from '@tanstack/react-router'
import { ArrowRight, Play, Shield, Zap, Sparkles, CheckCircle2 } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden">
      {/* Background radial glow & screen grid */}
      <div className="absolute inset-0 opacity-40 pointer-events-none"></div>

      <div className="page-x relative z-10">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full panel border border-signal-500/30 text-xs font-semibold text-signal-400 shadow-lg">
            <span className="flex h-2 w-2 rounded-full bg-signal-400 animate-pulse"></span>
            <span>Next-Gen Operating System for Advertising Screens</span>
            <span className="text-ink-500">|</span>
            <span className="text-ink-300">v2.4 Live</span>
          </div>

          {/* Main H1 Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-ink-50 leading-[1.08]">
            Power Millions of Screens.{' '}
            <span className="text-signal-400">Zero Downtime.</span>
          </h1>

          {/* 25 words or fewer value proposition */}
          <p className="text-lg sm:text-xl text-ink-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Viewixsoft is the enterprise cloud software that orchestrates content, live POS menus, telemetry, and NFC interactions across indoor and outdoor advertising displays worldwide.
          </p>

          {/* CTA Group */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl text-sm font-bold uppercase tracking-wider text-on-gradient bg-brand-gradient shine hover:opacity-95 shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <Sparkles className="w-4 h-4 text-ink-950" />
              Request demo
            </Link>
            <Link
              to="/products"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-sm font-semibold text-ink-50 bg-ink-900/90 hover:bg-ink-800 border border-ink-700/80 hover:border-ink-600 transition-all"
            >
              Explore Products
              <ArrowRight className="w-4 h-4 text-ink-400" />
            </Link>
          </div>

          {/* Micro trust indicators */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-ink-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-signal-400" />
              <span>Full Offline Playback</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-signal-400" />
              <span>SOC 2 Type II Certified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-signal-400" />
              <span>Sub-250ms POS Synchronization</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive Screen Preview Mockup */}
        <div className="mt-14 sm:mt-20 relative max-w-5xl mx-auto">
          {/* Glass frame */}
          <div className="relative rounded-2xl panel p-2 sm:p-3 border border-ink-700/80 shadow-2xl">
            {/* Display header bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-ink-800/80 text-xs text-ink-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/60 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500/60 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-green-500/60 inline-block"></span>
                <span className="ml-2 font-mono text-[11px] text-ink-500">Viewixsoft Studio Orchestrator — Live Canvas Matrix [4K]</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  CONNECTED
                </span>
                <span className="hidden sm:inline text-ink-500">FPS: 60.0 | JITTER: 0.2ms</span>
              </div>
            </div>

            {/* Display preview simulation */}
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-ink-950 border border-ink-800/80 grid grid-cols-12 gap-3 p-4">
              {/* Main Zone: Dynamic Ad Showcase */}
              <div className="col-span-8 rounded-lg bg-ink-900 border border-signal-500/30 p-6 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-signal-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-1 rounded bg-signal-500/20 text-signal-300 font-mono text-[11px] font-semibold border border-signal-500/30">
                    ZONE A: MAIN DOOH LOOP
                  </span>
                  <span className="font-mono text-xs text-ink-400">00:14 / 00:30</span>
                </div>
                <div className="my-auto space-y-2">
                  <span className="text-xs uppercase tracking-widest text-signal-400 font-semibold">Live Brand Campaign</span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-ink-50">Ultra-HD Dynamic Billboard</h3>
                  <p className="text-xs sm:text-sm text-ink-400 max-w-md">Daypart scheduled: Morning Rush Hour • Audience count: 2,420 • NFC Beacon Active</p>
                </div>
                <div className="w-full bg-ink-800/80 rounded-full h-1.5 overflow-hidden">
                  <div className=" bg-signal-400 h-full w-2/3"></div>
                </div>
              </div>

              {/* Side Zones: POS Sync & Telemetry */}
              <div className="col-span-4 flex flex-col gap-3">
                {/* Zone B: Real-time POS Widget */}
                <div className="flex-1 rounded-lg bg-ink-900/90 border border-ink-800 p-3.5 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[10px] font-mono text-ink-400">
                    <span className="text-signal-400 font-semibold">ZONE B: POS SYNC</span>
                    <span className="text-emerald-400">LIVE SYNCED</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink-50">Cold Brew Latte</div>
                    <div className="text-sm font-extrabold text-signal-400">$4.95 <span className="text-[10px] text-ink-500 line-through">$5.50</span></div>
                  </div>
                  <div className="text-[10px] text-ink-400 bg-ink-950/60 p-1.5 rounded font-mono">
                    Inventory: In Stock (86-trigger armed)
                  </div>
                </div>

                {/* Zone C: Hardware Telemetry */}
                <div className="flex-1 rounded-lg bg-ink-900/90 border border-ink-800 p-3.5 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[10px] font-mono text-ink-400">
                    <span className="text-signal-400 font-semibold">ZONE C: TELEMETRY</span>
                    <span>ID: NY-TIMES-04</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                    <div className="bg-ink-950 p-1.5 rounded border border-ink-800">
                      <div className="text-ink-400 text-[9px]">TEMP</div>
                      <div className="text-ink-50 font-bold">42°C</div>
                    </div>
                    <div className="bg-ink-950 p-1.5 rounded border border-ink-800">
                      <div className="text-ink-400 text-[9px]">UPTIME</div>
                      <div className="text-ink-50 font-bold">99.99%</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-emerald-400 flex items-center justify-between">
                    <span>Proof-of-play:</span>
                    <span className="font-mono">SHA-256 OK</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
