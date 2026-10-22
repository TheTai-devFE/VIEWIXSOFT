import { createFileRoute } from '@tanstack/react-router'
import { MediaSlotCard } from '~/components/admin/MediaSlotCard'
import { MEDIA_SLOTS } from '~/data/media-slots'
import type { MediaSlot } from '~/data/media-slots'
import { listMediaFn } from '~/server/functions/media-admin'

export const Route = createFileRoute('/admin/media')({
  loader: () => listMediaFn(),
  component: MediaPage,
})

const GROUPS = [...new Set(MEDIA_SLOTS.map((s) => s.group))]

function MediaPage() {
  const data = Route.useLoaderData()
  const current = new Map(data.slots.map((s) => [s.key, s]))

  return (
    <div className="space-y-10 py-8">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-50">Images</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-400">
          Replace an image without changing the layout. Use WebP where you can and keep files under 1.5 MB; the site
          shows new images within a minute.
        </p>
      </header>
      {!data.ok && (
        <p role="alert" className="rounded-xl border border-destructive/40 p-4 text-sm text-destructive">
          Images could not be loaded. Check DATABASE_URL and that migrations have run.
        </p>
      )}
      {GROUPS.map((group) => (
        <section key={group} aria-labelledby={`media-${group}`}>
          <h2 id={`media-${group}`} className="font-display text-xl font-semibold text-ink-50">
            {group}
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {MEDIA_SLOTS.filter((s): s is MediaSlot => s.group === group).map((slot) => (
              <MediaSlotCard key={slot.key} slot={slot} current={current.get(slot.key)} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
