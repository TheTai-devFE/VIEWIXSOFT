import { Link } from '@tanstack/react-router'
import { cn } from '~/lib/cn'
import type { Channel } from '~/components/story/story-content'

interface ChannelSwitcherProps<T extends Channel> {
  label: string
  channels: T[]
  active: T
  onChange: (channel: T) => void
}

/**
 * TV-remote style industry switcher. Buttons retune the stage; the link below
 * goes to the matching use case so the choice is never a dead end.
 */
export function ChannelSwitcher<T extends Channel>({ label, channels, active, onChange }: ChannelSwitcherProps<T>) {
  return (
    <div>
      <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
        {channels.map((c, i) => {
          const isActive = c.id === active.id
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(c)}
              className={cn(
                'rounded-sm border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors',
                isActive
                  ? 'border-signal-400 bg-signal-400 text-ink-950'
                  : 'border-ink-700 text-ink-300 hover:border-ink-500 hover:text-ink-50',
              )}
            >
              <span className={cn('mr-1.5', isActive ? 'text-ink-800' : 'text-ink-500')}>{String(i + 1).padStart(2, '0')}</span>
              {c.label}
            </button>
          )
        })}
      </div>
      <Link
        to="/use-cases/$slug"
        params={{ slug: active.useCaseSlug }}
        className="mt-2.5 inline-block text-xs text-ink-400 underline decoration-ink-600 underline-offset-4 hover:text-ink-50"
      >
        See the {active.label.toLowerCase()} use case
      </Link>
    </div>
  )
}
