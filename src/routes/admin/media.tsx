import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { AdminPageHeader, LoadError } from '~/components/admin/admin-ui'
import { MediaSlotCard } from '~/components/admin/MediaSlotCard'
import { MEDIA_SLOTS } from '~/data/media-slots'
import type { MediaSlot } from '~/data/media-slots'
import { cn } from '~/lib/cn'
import { listMediaFn } from '~/server/functions/media-admin'

export const Route = createFileRoute('/admin/media')({
  loader: () => listMediaFn(),
  component: MediaModule,
})

const GROUPS = [...new Set(MEDIA_SLOTS.map((s) => s.group))]

function MediaModule() {
  const data = Route.useLoaderData()
  const current = new Map(data.slots.map((s) => [s.key, s]))
  const [group, setGroup] = useState<MediaSlot['group'] | 'all'>('all')
  const shown = GROUPS.filter((g) => group === 'all' || g === group)

  return (
    <>
      <AdminPageHeader
        title="Images"
        description="Replace an image without changing the layout. Use WebP where you can and keep files under 1.5 MB."
      />
      {!data.ok && <LoadError>Images could not be loaded. Check DATABASE_URL and that migrations have run.</LoadError>}

      <nav aria-label="Image groups" className="mb-6 flex flex-wrap gap-2">
        {(['all', ...GROUPS] as const).map((g) => {
          const count = g === 'all' ? MEDIA_SLOTS.length : MEDIA_SLOTS.filter((s) => s.group === g).length
          return (
            <button
              key={g}
              type="button"
              aria-pressed={g === group}
              onClick={() => setGroup(g)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                g === group ? 'border-transparent bg-brand-gradient text-on-gradient' : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {g === 'all' ? 'All' : g} <span className="opacity-70">({count})</span>
            </button>
          )
        })}
      </nav>

      <div className="space-y-10">
        {shown.map((g) => (
          <section key={g} aria-labelledby={`media-${g}`}>
            <h2 id={`media-${g}`} className="font-display text-lg font-semibold text-foreground">
              {g}
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {MEDIA_SLOTS.filter((s) => s.group === g).map((slot) => (
                <MediaSlotCard key={slot.key} slot={slot} current={current.get(slot.key)} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}
