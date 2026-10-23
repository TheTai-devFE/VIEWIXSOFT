import { Star } from 'lucide-react'
import type { EarlyCustomer } from '~/data/early-customers'
import { MagicCard } from '~/components/ui/magic-card'
import { Marquee } from '~/components/ui/marquee'

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function CustomerCard({ customer }: { customer: EarlyCustomer }) {
  return (
    <li className="w-80 shrink-0 sm:w-96">
      {/* Magic UI spotlight: the border and a soft glow follow the pointer. */}
      <MagicCard className="h-full">
        <figure className="flex h-full flex-col p-6 sm:p-8">
          {/* The glyph sits high in its line box, so a short fixed box keeps it close to the quote. */}
          <span aria-hidden="true" className="block h-8 font-display text-6xl leading-none text-brand-gradient">
            “
          </span>
          <blockquote className="mt-1 flex-1 text-lg leading-relaxed text-pretty text-ink-100">{customer.quote}</blockquote>

          <figcaption className="mt-8 flex items-center gap-4 border-t border-ink-800 pt-6">
            {customer.avatar ? (
              <img
                src={customer.avatar}
                alt=""
                width={48}
                height={48}
                loading="lazy"
                className="size-12 rounded-full object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="grid size-12 shrink-0 place-items-center rounded-full border border-ink-700 font-mono text-sm font-bold text-ink-300"
              >
                {initials(customer.name)}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-ink-50">{customer.name}</span>
              <span className="block truncate text-sm text-ink-400">
                {customer.role}, {customer.company}
              </span>
            </span>
            {customer.rating ? (
              <span className="flex shrink-0 gap-0.5" role="img" aria-label={`Rated ${customer.rating} out of 5`}>
                {Array.from({ length: customer.rating }, (_, i) => (
                  <Star key={i} className="size-4 fill-signal-400 text-signal-400" aria-hidden="true" />
                ))}
              </span>
            ) : null}
          </figcaption>

          {customer.uses.length > 0 && (
            <ul aria-label="Uses" className="mt-4 flex flex-wrap gap-2">
              {customer.uses.map((item) => (
                <li key={item} className="rounded-full border border-ink-700 px-2.5 py-1 font-mono text-xs text-ink-300">
                  {item}
                </li>
              ))}
            </ul>
          )}
        </figure>
      </MagicCard>
    </li>
  )
}

/**
 * Customer quotes on an endless row that pauses on hover or focus. The edges
 * fade out so cards slide in and out rather than being cut off.
 */
export function CustomerMarquee({ customers }: { customers: EarlyCustomer[] }) {
  return (
    <Marquee pauseOnHover className="py-2 [--duration:60s] [--gap:1.25rem] mask-x-from-90% mask-x-to-100%">
      <ul className="flex gap-(--gap)">
        {customers.map((customer) => (
          <CustomerCard key={`${customer.name}-${customer.company}`} customer={customer} />
        ))}
      </ul>
    </Marquee>
  )
}
