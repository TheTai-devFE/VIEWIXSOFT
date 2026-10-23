import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { ImageUp, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { DragEvent } from 'react'
import { AdminPageHeader, buttonSecondary, LoadError } from '~/components/admin/admin-ui'
import { AssetPreview } from '~/components/admin/ImagePickerSheet'
import { findAdminPage } from '~/data/admin-pages'
import { ALLOWED_VIDEO_TYPES, isVideoAsset, MAX_VIDEO_BYTES, MEDIA_SLOTS, slotPages } from '~/data/media-slots'
import { cn } from '~/lib/cn'
import { MAX_EDGE, prepareImage } from '~/lib/image-prepare'
import { readVideoSize, uploadLibraryVideo } from '~/lib/media-upload'
import { deleteMediaAssetFn, listMediaLibraryFn, uploadMediaAssetFn } from '~/server/functions/media-admin'

export const Route = createFileRoute('/admin/media')({
  loader: () => listMediaLibraryFn(),
  component: MediaLibrary,
})

type Saving = { name: string; before: number; after: number }
type Progress =
  | { kind: 'idle' }
  | { kind: 'working'; step: 'Optimizing' | 'Uploading'; current: number; total: number; share?: number }
  | { kind: 'done'; errors: string[]; uploaded: number; savings: Saving[] }

const isVideoFile = (file: File) => ALLOWED_VIDEO_TYPES.some((t) => t === file.type)

const formatBytes = (n: number | null) => (n === null ? null : n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`)

/** Page names that show an image, from the slots pointing at it. */
function usedOn(
  assetId: string,
  slots: { key: string; assetId: string }[],
  sectionUses: { assetId: string; label: string }[],
) {
  const pages = new Set<string>()
  for (const u of sectionUses) if (u.assetId === assetId) pages.add(u.label)
  for (const s of slots) {
    if (s.assetId !== assetId) continue
    const slot = MEDIA_SLOTS.find((m) => m.key === s.key)
    for (const p of slot ? slotPages(slot) : []) pages.add(findAdminPage(p)?.page.label ?? p)
  }
  return [...pages]
}

function MediaLibrary() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const [progress, setProgress] = useState<Progress>({ kind: 'idle' })
  const [dragging, setDragging] = useState(false)
  const [deleteError, setDeleteError] = useState<{ id: string; message: string } | null>(null)
  const uploading = progress.kind === 'working'

  // Videos go as they are, straight to storage where possible; they are too big for a server function.
  const uploadVideo = async (file: File, at: { current: number; total: number }) => {
    if (file.size > MAX_VIDEO_BYTES) {
      return `${file.name} is ${formatBytes(file.size)}. Keep videos under ${formatBytes(MAX_VIDEO_BYTES)}; export a shorter or smaller file.`
    }
    const size = await readVideoSize(file)
    if (!size) return `${file.name}: this browser could not play it. Use an MP4 (H.264) or WebM video.`
    setProgress({ kind: 'working', step: 'Uploading', ...at, share: 0 })
    const res = await uploadLibraryVideo(file, size, (share) => setProgress({ kind: 'working', step: 'Uploading', ...at, share }))
    return res.ok ? null : res.error
  }

  // Each image is shrunk in the browser, then sent on its own, so errors are reported per file.
  const upload = async (files: File[]) => {
    if (!files.length || uploading) return
    const errors: string[] = []
    const savings: Saving[] = []
    let uploaded = 0
    for (const [i, original] of files.entries()) {
      const at = { current: i + 1, total: files.length }
      try {
        if (isVideoFile(original)) {
          const error = await uploadVideo(original, at)
          if (error) errors.push(error)
          else uploaded++
          continue
        }
        setProgress({ kind: 'working', step: 'Optimizing', ...at })
        const prepared = await prepareImage(original)
        if (prepared.changed) savings.push({ name: original.name, before: prepared.before, after: prepared.after })
        setProgress({ kind: 'working', step: 'Uploading', ...at })
        const form = new FormData()
        form.set('file', prepared.file)
        const res = await uploadMediaAssetFn({ data: form })
        if (res.ok) uploaded++
        else errors.push(res.error)
      } catch {
        errors.push(`${original.name}: upload failed. Check your connection.`)
      }
    }
    await router.invalidate()
    setProgress({ kind: 'done', errors, uploaded, savings })
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    void upload([...e.dataTransfer.files])
  }

  const remove = async (id: string, name: string) => {
    if (!window.confirm(`Delete ${name} from the library?`)) return
    setDeleteError(null)
    const res = await deleteMediaAssetFn({ data: { id } })
    if (!res.ok) return setDeleteError({ id, message: res.error })
    await router.invalidate()
  }

  return (
    <>
      <AdminPageHeader
        title="Media"
        description="Upload images and videos to the library here. Then choose where each one shows in that page's editor under Pages."
      />
      {!data.ok && <LoadError>The library could not be loaded. Check DATABASE_URL and that migrations have run.</LoadError>}

      <label
        htmlFor="media-upload"
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center transition-colors focus-within:ring-[3px] focus-within:ring-ring/50',
          dragging ? 'border-signal-500 bg-signal-950/40' : 'border-border bg-card hover:border-ink-500',
        )}
      >
        <ImageUp aria-hidden="true" className="size-6 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          {progress.kind === 'working'
            ? `${progress.step} ${progress.current} of ${progress.total}…${progress.share === undefined ? '' : ` ${Math.round(progress.share * 100)}%`}`
            : 'Drop images or videos here, or click to choose'}
        </span>
        <span className="text-xs text-muted-foreground">
          Images are resized to {MAX_EDGE} px and compressed to WebP · videos as MP4 (H.264) or WebM up to{' '}
          {formatBytes(MAX_VIDEO_BYTES)} · several at once
        </span>
        <input
          id="media-upload"
          type="file"
          multiple
          // Any image the browser can open (converted to WebP, JPEG or PNG before upload), or a web video.
          accept={['image/*', ...ALLOWED_VIDEO_TYPES].join(',')}
          disabled={uploading}
          className="sr-only"
          onChange={(e) => {
            void upload([...(e.target.files ?? [])])
            e.target.value = ''
          }}
        />
      </label>

      {progress.kind === 'done' && (
        <div role="status" className="mt-3 space-y-1 text-sm">
          {progress.uploaded > 0 && (
            <p className="text-muted-foreground">
              {progress.uploaded} file{progress.uploaded > 1 ? 's' : ''} uploaded. Pick where to show them in{' '}
              <Link to="/admin/pages" className="font-medium text-signal-400 underline-offset-2 hover:underline">
                Pages
              </Link>
              .
            </p>
          )}
          {progress.savings.length > 0 && (
            <ul className="text-xs text-muted-foreground">
              {progress.savings.map((s) => (
                <li key={s.name}>
                  {s.name}: {formatBytes(s.before)} → {formatBytes(s.after)}
                </li>
              ))}
            </ul>
          )}
          {progress.errors.length > 0 && (
            <ul className="space-y-1 text-destructive">
              {progress.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <h2 className="mt-10 mb-4 font-display text-lg font-semibold text-foreground">
        Library <span className="font-normal text-muted-foreground">({data.assets.length})</span>
      </h2>
      {data.assets.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No images or videos yet. Upload some above.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
          {data.assets.map((asset) => {
            const pages = usedOn(asset.id, data.slots, data.sectionUses)
            return (
              <li key={asset.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <AssetPreview asset={asset} />
                <div className="space-y-1 p-3">
                  <p className="truncate text-sm font-medium text-foreground" title={asset.fileName}>
                    {asset.fileName}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {isVideoAsset(asset) && 'Video · '}
                    {asset.width}×{asset.height}
                    {asset.bytes !== null && ` · ${formatBytes(asset.bytes)}`}
                  </p>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <p className={cn('truncate text-xs', pages.length ? 'text-signal-400' : 'text-muted-foreground')}>
                      {pages.length ? `On ${pages.join(', ')}` : 'Not used'}
                    </p>
                    <button
                      type="button"
                      onClick={() => void remove(asset.id, asset.fileName)}
                      aria-label={`Delete ${asset.fileName}`}
                      className={cn(buttonSecondary, 'size-8 shrink-0 p-0')}
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                  {deleteError?.id === asset.id && (
                    <p role="alert" className="text-xs text-destructive">
                      {deleteError.message}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
