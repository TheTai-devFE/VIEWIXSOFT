import { Quote, Star } from 'lucide-react'

export function Testimonials() {
  const testimonials = [
    {
      quote: "Viewixsoft replaced our archaic USB stick updates with an automated cloud network that turns storefront displays into direct revenue drivers.",
      author: "Marcus Vance",
      role: "VP of Global Retail Operations",
      company: "Aura Fashion Brands (450 Stores)",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
    },
    {
      quote: "Our menu boards now intelligently promote surplus ingredients and update prices instantly across 1,200 screens without a single manual intervention.",
      author: "Elena Gomez",
      role: "Chief Technology Officer",
      company: "BurgerCraft International (QSR Chain)",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80"
    },
    {
      quote: "The cryptographic proof-of-play alone won us multi-million dollar contracts with Fortune 500 brands who require absolute transparency.",
      author: "Craig Henderson",
      role: "Managing Director",
      company: "Apex Media Out-of-Home (15,000 Billboards)",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
    }
  ]

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs uppercase tracking-widest text-signal-400 font-bold">
            Trusted by Screen Operators
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-ink-50">
            Proven at Enterprise Scale
          </h2>
          <p className="text-base text-ink-400">
            Hear from operations directors, CTOs, and media executives who rely on Viewixsoft daily.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="p-8 rounded-2xl panel border border-ink-800 flex flex-col justify-between space-y-6 group hover:border-signal-500/30 transition-all"
            >
              <div className="space-y-4">
                <div className="flex gap-1 text-signal-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-signal-400" />
                  ))}
                </div>
                <p className="text-sm text-ink-300 italic leading-relaxed">
                  "{t.quote}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-ink-800/80">
                <img
                  src={t.avatar}
                  alt={t.author}
                  className="w-10 h-10 rounded-full object-cover border border-signal-500/40"
                  loading="lazy"
                />
                <div>
                  <div className="font-semibold text-sm text-ink-50">{t.author}</div>
                  <div className="text-[11px] text-signal-400 font-medium">{t.role}</div>
                  <div className="text-[10px] text-ink-500">{t.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
