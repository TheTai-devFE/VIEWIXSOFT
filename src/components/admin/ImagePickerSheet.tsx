import { Link } from '@tanstack/react-router'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { isVideoAsset } from '~/data/media-slots'
import { cn } from '~/lib/cn'

export interface LibraryAsset {
  id: string
  url: string
  fileName: string
  contentType: string
  width: number
  height: number
  alt: string
  createdAt: Date
}

/** Side panel listing the library's images, or its videos; picking one closes it. */
export function ImagePickerSheet({
  open,
  onClose,
  assets: library,
  currentId,
  description,
  onPick,
  kind = 'image',
}: {
  open: boolean
  onClose: () => void
  assets: LibraryAsset[]
  currentId: string | null | undefined
  description: string
  onPick: (asset: LibraryAsset) => void
  kind?: 'image' | 'video'
}) {
  // Each place on the site takes one kind of file.
  const assets = library.filter((a) => isVideoAsset(a) === (kind === 'video'))
  const noun = kind === 'video' ? 'video' : 'image'
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Choose {kind === 'video' ? 'a video' : 'an image'}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          {assets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              The library has no {noun}s yet.{' '}
              <Link to="/admin/media" className="font-medium text-signal-400 underline-offset-2 hover:underline">
                Upload {noun}s
              </Link>{' '}
              first.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {assets.map((a) => {
                const current = currentId === a.id
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      aria-pressed={current}
                      onClick={() => {
                        onPick(a)
                        onClose()
                      }}
                      className={cn(
                        'w-full overflow-hidden rounded-lg border text-left transition-colors',
                        current ? 'border-signal-500 ring-2 ring-signal-500/40' : 'border-border hover:border-ink-500',
                      )}
                    >
                      <AssetPreview asset={a} />
                      <span className="block truncate px-2 py-1.5 text-xs text-foreground">{a.fileName}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** A library file's thumbnail: the image, or the first frame of a video. */
export function AssetPreview({ asset, className }: { asset: LibraryAsset; className?: string }) {
  const box = cn('aspect-4/3 w-full bg-ink-950 object-contain', className)
  if (isVideoAsset(asset)) {
    return (
      <span className="relative block">
        {/* metadata only: the first frame, without downloading the video. */}
        <video src={asset.url} preload="metadata" muted playsInline width={asset.width} height={asset.height} className={box} />
        <span className="absolute top-2 left-2 rounded bg-ink-950/80 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-ink-100 uppercase">
          Video
        </span>
      </span>
    )
  }
  return <img src={asset.url} alt="" width={asset.width} height={asset.height} loading="lazy" className={box} />
}
