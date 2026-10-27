import { useImperativeHandle, useState } from 'react'
import type { Ref } from 'react'
import { buttonSecondary } from '~/components/admin/admin-ui'
import { ImagePickerSheet } from '~/components/admin/ImagePickerSheet'
import type { LibraryAsset } from '~/components/admin/ImagePickerSheet'
import type { EditorHandle } from '~/components/admin/admin-ui'
import { useReportDirty } from '~/hooks/use-save-all'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { findAdminPage } from '~/data/admin-pages'
import { slotPages } from '~/data/media-slots'
import type { MediaSlot } from '~/data/media-slots'
import { MediaAltSchema } from '~/lib/admin-schemas'
import { saveMediaSlotsFn } from '~/server/functions/media-admin'
import { LazyImage } from '~/components/ui/lazy-image'


type Pick = { assetId: string | null; alt: string }

const altError = (p: Pick | undefined) =>
  p?.assetId && !MediaAltSchema.safeParse(p.alt).success ? 'Describe the image in a few words' : undefined

const same = (a: Pick | undefined, b: Pick | undefined) =>
  (a?.assetId ?? null) === (b?.assetId ?? null) && (a?.assetId ? a.alt.trim() === b?.alt.trim() : true)

/**
 * A list of image places (one section's, or a page's), each filled from the
 * library in /admin/media or left on its default. Saving is driven by the
 * page header through `ref`.
 */
export function MediaSlotsEditor({
  pageKey,
  slots,
  assets,
  saved,
  ref,
  onDirtyChange,
}: {
  pageKey: string
  slots: MediaSlot[]
  assets: LibraryAsset[]
  saved: { key: string; assetId: string; alt: string }[]
  ref?: Ref<EditorHandle>
  onDirtyChange?: (dirty: boolean) => void
}) {
  const initial: Record<string, Pick> = Object.fromEntries(saved.map((s) => [s.key, { assetId: s.assetId, alt: s.alt }]))
  const [picks, setPicks] = useState<Record<string, Pick>>(initial)
  const [picking, setPicking] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const byId = new Map(assets.map((a) => [a.id, a]))

  const changed = slots.filter((s) => !same(picks[s.key], initial[s.key]))
  const dirty = changed.length > 0

  useReportDirty(dirty, onDirtyChange)

  useImperativeHandle(
    ref,
    () => ({
      save: async () => {
        if (!dirty) return null
        if (changed.some((s) => altError(picks[s.key]))) {
          setShowErrors(true)
          return { ok: false, error: 'Add alt text to every picked image.' }
        }
        try {
          return await saveMediaSlotsFn({
            data: {
              changes: changed.map((s) => ({ key: s.key, assetId: picks[s.key]?.assetId ?? null, alt: picks[s.key]?.alt ?? '' })),
            },
          })
        } catch {
          return { ok: false, error: 'Images could not be saved. Check your connection.' }
        }
      },
    }),
    [dirty, changed, picks],
  )

  const pickingSlot = slots.find((s) => s.key === picking)

  return (
    <>
      <ul className="divide-y divide-ink-800 rounded-xl border border-ink-800">
        {slots.map((slot) => {
          const pick = picks[slot.key]
          const asset = pick?.assetId ? byId.get(pick.assetId) : undefined
          const shown = asset ? { src: asset.url, width: asset.width, height: asset.height } : slot.fallback
          const others = slotPages(slot).filter((p) => p !== pageKey).map((p) => findAdminPage(p)?.page.label ?? p)
          const error = showErrors ? altError(pick) : undefined
          const altId = `alt-${slot.key.replace(/\./g, '-')}`
          return (
            <li key={slot.key} className="flex flex-wrap items-start gap-4 px-4 py-3 sm:flex-nowrap">
              {shown ? (
                <LazyImage
                  src={shown.src}
                  alt=""
                  width={shown.width}
                  height={shown.height}
                  className="aspect-4/3 w-24 shrink-0 rounded-md bg-ink-950 object-contain"
                />
              ) : (
                <span aria-hidden="true" className="aspect-4/3 w-24 shrink-0 rounded-md border border-dashed border-ink-700" />
              )}
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium text-ink-50">{slot.label}</span>
                    <span className="font-mono text-[10px] text-ink-500 uppercase">{asset ? 'Library' : 'Default'}</span>
                  </p>
                  <p className="text-xs text-ink-500">
                    {slot.group}
                    {others.length > 0 && ` · also on ${others.join(', ')}`}
                  </p>
                </div>
                {asset && (
                  <div>
                    <Label htmlFor={altId} className="text-xs">
                      Alt text
                    </Label>
                    <Input
                      id={altId}
                      value={pick?.alt ?? ''}
                      onChange={(e) => setPicks((p) => ({ ...p, [slot.key]: { assetId: asset.id, alt: e.target.value } }))}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? `${altId}-error` : undefined}
                      className="mt-1 h-9 bg-background"
                    />
                    {error && (
                      <p id={`${altId}-error`} className="mt-1 text-xs text-destructive">
                        {error}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => setPicking(slot.key)} className={buttonSecondary}>
                  Choose
                  <span className="sr-only"> image for {slot.label}</span>
                </button>
                {asset && (
                  <button
                    type="button"
                    onClick={() => setPicks((p) => ({ ...p, [slot.key]: { assetId: null, alt: '' } }))}
                    className={buttonSecondary}
                  >
                    Default
                    <span className="sr-only"> image for {slot.label}</span>
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <ImagePickerSheet
        open={picking !== null}
        onClose={() => setPicking(null)}
        assets={assets}
        currentId={picking === null ? null : picks[picking]?.assetId}
        description={pickingSlot ? `${pickingSlot.label}. ${pickingSlot.guidance}` : 'Pick from the library.'}
        onPick={(a) => {
          if (picking === null) return
          setPicks((p) => ({
            ...p,
            // Keep the alt already written when the same image is picked again.
            [picking]: { assetId: a.id, alt: p[picking]?.assetId === a.id ? (p[picking]?.alt ?? a.alt) : a.alt },
          }))
        }}
      />
    </>
  )
}
