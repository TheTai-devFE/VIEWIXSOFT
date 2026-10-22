import { Link } from '@tanstack/react-router'
import { PRODUCTS } from '~/content/products'
import { 
  Monitor, Cpu, Activity, Smartphone, ArrowRight, 
  Layers, CheckCircle2, Zap 
} from 'lucide-react'

export function ProductBento() {
  const getIcon = (slug: string) => {
    switch (slug) {
      case 'cms': return <Monitor className="w-6 h-6 text-signal-400" />
      case 'pos': return <Cpu className="w-6 h-6 text-signal-400" />
      case 'tracking': return <Activity className="w-6 h-6 text-signal-400" />
      case 'nfc': return <Smartphone className="w-6 h-6 text-signal-400" />
      default: return <Monitor className="w-6 h-6 text-signal-400" />
    }
  }

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs uppercase tracking-widest text-signal-400 font-bold">
            The Complete Screen Ecosystem
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-ink-50">
            Four Modular Engines. One Cohesive Platform.
          </h2>
          <p className="text-base text-ink-400 leading-relaxed">
            Every product can operate as an independent powerhouse or synchronize together into a zero-latency digital signage ecosystem.
          </p>
        </div>

        {/* 2x2 Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PRODUCTS.map((prod) => (
            <div
              key={prod.id}
              className="panel-card rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-ink-900 border border-ink-800 flex items-center justify-center group-hover:border-signal-500/40 transition-colors">
                    {getIcon(prod.slug)}
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-signal-950/60 text-signal-400 border border-signal-800/40">
                    {prod.heroBadge}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-ink-50 group-hover:text-signal-300 transition-colors">
                    {prod.name}
                  </h3>
                  <p className="text-xs font-mono text-ink-400 mt-1">
                    {prod.tagline}
                  </p>
                </div>

                <p className="text-sm text-ink-300 leading-relaxed">
                  {prod.shortDescription}
                </p>

                {/* Key feature highlights */}
                <div className="space-y-2 pt-2">
                  {prod.features.slice(0, 2).map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-ink-300">
                      <CheckCircle2 className="w-4 h-4 text-signal-400 shrink-0 mt-0.5" />
                      <span><strong>{feat.title}:</strong> {feat.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom footer bar with link */}
              <div className="pt-8 mt-6 border-t border-ink-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-ink-400">
                  <Layers className="w-3.5 h-3.5 text-signal-400" />
                  <span>Supports: {prod.supportedOS.slice(0, 3).join(', ')}</span>
                </div>
                <Link
                  to="/products/$slug"
                  params={{ slug: prod.slug }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-signal-400 hover:text-signal-300 transition-colors group/btn"
                >
                  Deep Dive Specs
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Bundles Banner */}
        <div className="mt-12 rounded-2xl panel p-6 sm:p-8 border border-signal-500/20 bg-ink-950 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-signal-400 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" /> Recommended Synergy Bundles
            </div>
            <h4 className="text-xl font-bold text-ink-50">Combine CMS + Tracking for DOOH, or POS + NFC for Retail</h4>
            <p className="text-xs text-ink-400">Save 25% on enterprise licensing when deploying integrated dual-stack bundles.</p>
          </div>
          <Link
            to="/contact"
            className="shrink-0 px-6 py-3 rounded-xl bg-signal-500 hover:bg-brand-gradient shine text-on-gradient font-bold text-xs uppercase tracking-wider transition-all"
          >
            Inquire About Bundles
          </Link>
        </div>
      </div>
    </section>
  )
}
