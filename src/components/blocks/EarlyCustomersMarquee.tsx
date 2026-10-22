import { Star } from 'lucide-react'
import type { EarlyCustomer } from '~/data/early-customers'

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function CustomerCard({ customer, hidden }: { customer: EarlyCustomer; hidden?: boolean }) {
  return (
    <li
      aria-hidden={hidden || undefined}
      className="mr-6 w-80 sm:w-96 shrink-0 rounded-3xl border border-ink-800 bg-ink-950 p-6 sm:p-8 space-y-5 shadow-[inset_0_1px_0_0_color-mix(in_oklab,var(--color-ink-50)_8%,transparent)]"
    >
      <div className="flex items-center gap-4">
        {customer.avatar ? (
          <img
            src={customer.avatar}
            alt=""
            width={56}
            height={56}
            loading="lazy"
            className="size-14 rounded-full object-cover"
          />
        ) : (
          <span
            className="grid size-14 place-items-center rounded-full border border-ink-700 font-mono text-sm font-bold text-ink-300"
            aria-hidden="true"
          >
            {initials(customer.name)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-ink-50">{customer.name}</p>
          <p className="truncate text-sm text-ink-400">
            {customer.role}, {customer.company}
          </p>
        </div>
      </div>
      <blockquote className="text-ink-200 leading-relaxed">“{customer.quote}”</blockquote>
      <div className="flex flex-wrap items-center gap-2">
        {customer.uses.map((item) => (
          <span
            key={item}
            className="rounded-full border border-ink-700 px-2.5 py-1 text-xs font-mono text-ink-300"
          >
            {item}
          </span>
        ))}
        {customer.rating ? (
          <span className="ml-auto flex gap-0.5" role="img" aria-label={`Rated ${customer.rating} out of 5`}>
            {Array.from({ length: customer.rating }, (_, i) => (
              <Star key={i} className="size-4 fill-signal-400 text-signal-400" aria-hidden="true" />
            ))}
          </span>
        ) : null}
      </div>
    </li>
  )
}

/**
 * Endless row of customer cards. The list renders twice so the CSS loop is
 * seamless; the copy is hidden from assistive tech. Pauses on hover and focus,
 * and stays still under prefers-reduced-motion (the row scrolls by hand).
 */
export function EarlyCustomersMarquee({ customers }: { customers: EarlyCustomer[] }) {
  return (
    <div className="group overflow-x-auto motion-safe:overflow-hidden mask-x-from-90% mask-x-to-100% py-2">
      <ul className="flex w-max motion-safe:animate-marquee group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
        {customers.map((customer) => (
          <CustomerCard key={customer.name} customer={customer} />
        ))}
        {customers.map((customer) => (
          <CustomerCard key={`copy-${customer.name}`} customer={customer} hidden />
        ))}
      </ul>
    </div>
  )
}
