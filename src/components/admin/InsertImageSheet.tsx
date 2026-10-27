import { useState, useRef } from 'react'
import {
  UploadCloud,
  Image as ImageIcon,
  Link as LinkIcon,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { prepareImage } from '~/lib/image-prepare'
import { uploadMediaAssetFn } from '~/server/functions/media-admin'
import { altFromFileName, isVideoAsset } from '~/data/media-slots'
import type { LibraryAsset } from '~/components/admin/ImagePickerSheet'
import { AssetPreview } from '~/components/admin/ImagePickerSheet'
import { cn } from '~/lib/cn'

export interface InsertImageSheetProps {
  open: boolean
  onClose: () => void
  assets: LibraryAsset[]
  onInsert: (data: { url: string; alt: string; asset?: LibraryAsset }) => void
  onAssetUploaded?: (asset: LibraryAsset) => void
}

export function InsertImageSheet({
  open,
  onClose,
  assets,
  onInsert,
  onAssetUploaded,
}: InsertImageSheetProps) {
  const [tab, setTab] = useState<'upload' | 'library' | 'url'>('upload')

  // Upload Tab State
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadAlt, setUploadAlt] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Library Tab State
  const [selectedAsset, setSelectedAsset] = useState<LibraryAsset | null>(null)
  const [libraryAlt, setLibraryAlt] = useState('')

  // URL Tab State
  const [directUrl, setDirectUrl] = useState('')
  const [urlAlt, setUrlAlt] = useState('')

  const imageAssets = assets.filter((a) => !isVideoAsset(a))

  const handleSelectFile = (selected: File) => {
    setUploadError(null)
    setFile(selected)
    setUploadAlt(altFromFileName(selected.name))
    const objectUrl = URL.createObjectURL(selected)
    setPreviewUrl(objectUrl)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleSelectFile(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f && f.type.startsWith('image/')) {
      handleSelectFile(f)
    }
  }

  const handleUploadSubmit = async () => {
    if (!file) return
    setIsUploading(true)
    setUploadError(null)

    try {
      const prepared = await prepareImage(file)
      const form = new FormData()
      form.set('file', prepared.file)

      const res = await uploadMediaAssetFn({ data: form })
      if (!res.ok || !res.asset?.url) {
        setUploadError(res.ok ? 'Không tải ảnh lên được.' : res.error)
        setIsUploading(false)
        return
      }

      const uploadedAsset: LibraryAsset = {
        id: res.asset.id,
        url: res.asset.url,
        fileName: res.asset.fileName,
        contentType: res.asset.contentType,
        width: res.asset.width,
        height: res.asset.height,
        alt: uploadAlt.trim() || res.asset.alt,
        createdAt: new Date(res.asset.createdAt),
      }

      onAssetUploaded?.(uploadedAsset)
      onInsert({
        url: res.asset.url,
        alt: uploadAlt.trim() || res.asset.alt,
        asset: uploadedAsset,
      })

      // Reset & close
      setFile(null)
      setPreviewUrl(null)
      setUploadAlt('')
      setIsUploading(false)
      onClose()
    } catch (err: any) {
      setUploadError(err?.message || 'Có lỗi khi tải file lên.')
      setIsUploading(false)
    }
  }

  const handleLibrarySubmit = () => {
    if (!selectedAsset) return
    onInsert({
      url: selectedAsset.url,
      alt: libraryAlt.trim() || selectedAsset.alt,
      asset: selectedAsset,
    })
    setSelectedAsset(null)
    setLibraryAlt('')
    onClose()
  }

  const handleUrlSubmit = () => {
    if (!directUrl.trim()) return
    onInsert({
      url: directUrl.trim(),
      alt: urlAlt.trim() || 'Image',
    })
    setDirectUrl('')
    setUrlAlt('')
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && !isUploading && onClose()}>
      <SheetContent side="right" className="flex h-full w-full flex-col gap-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle>Chèn ảnh vào bài viết</SheetTitle>
          <SheetDescription>
            Tải ảnh mới lên, chọn từ thư viện ảnh, hoặc chèn bằng URL.
          </SheetDescription>

          {/* Navigation Tabs */}
          <div className="mt-4 flex rounded-lg border border-border p-1 bg-ink-950/40">
            <button
              type="button"
              onClick={() => setTab('upload')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-colors',
                tab === 'upload' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <UploadCloud className="size-3.5" /> Tải lên
            </button>
            <button
              type="button"
              onClick={() => setTab('library')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-colors',
                tab === 'library' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <ImageIcon className="size-3.5" /> Thư viện ({imageAssets.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('url')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-colors',
                tab === 'url' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LinkIcon className="size-3.5" /> Dùng URL
            </button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: UPLOAD */}
          {tab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                className="hidden"
                onChange={handleFileChange}
              />

              {!previewUrl ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors',
                    isDragging
                      ? 'border-signal-400 bg-signal-500/10'
                      : 'border-border bg-ink-950/40 hover:border-signal-400/70 hover:bg-ink-950',
                  )}
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-ink-900 text-signal-400">
                    <UploadCloud className="size-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Bấm để chọn ảnh hoặc kéo thả vào đây</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      WebP, PNG, JPEG hoặc AVIF. Ảnh được tự động tối ưu trước khi lưu.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 rounded-2xl border border-border bg-ink-950/40 p-4">
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-ink-950">
                    <img src={previewUrl} alt="Xem trước ảnh tải lên" className="h-full w-full object-contain" />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate max-w-[240px] font-medium text-foreground">{file?.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null)
                        setPreviewUrl(null)
                        setUploadAlt('')
                      }}
                      className="text-xs font-semibold text-destructive hover:underline"
                    >
                      Chọn ảnh khác
                    </button>
                  </div>

                  <div>
                    <Label htmlFor="upload-alt" className="text-xs font-medium">
                      Alt text / chú thích ảnh (tiếng Anh) *
                    </Label>
                    <Input
                      id="upload-alt"
                      value={uploadAlt}
                      onChange={(e) => setUploadAlt(e.target.value)}
                      placeholder="e.g. Digital signage wall inside retail store"
                      className="mt-1 text-sm"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Dùng cho trình đọc màn hình và làm chú thích dưới ảnh.
                    </p>
                  </div>

                  {uploadError && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                      <AlertCircle className="size-4 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={handleUploadSubmit}
                    className="bg-brand-gradient flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-on-gradient hover:opacity-90 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Đang tải lên và chèn…
                      </>
                    ) : (
                      <>
                        <Check className="size-4" /> Tải lên và chèn vào bài
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MEDIA LIBRARY */}
          {tab === 'library' && (
            <div className="space-y-4">
              {imageAssets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                  <ImageIcon className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold text-foreground">Thư viện chưa có ảnh nào</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tải ảnh đầu tiên lên để chèn vào bài viết.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab('upload')}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-signal-400 hover:bg-accent"
                  >
                    <UploadCloud className="size-3.5" /> Chuyển sang tải lên
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {imageAssets.map((asset) => {
                      const isSelected = selectedAsset?.id === asset.id
                      return (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => {
                            setSelectedAsset(asset)
                            setLibraryAlt(asset.alt)
                          }}
                          className={cn(
                            'group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all',
                            isSelected
                              ? 'border-signal-500 ring-2 ring-signal-500/50 bg-signal-500/5'
                              : 'border-border hover:border-ink-500 bg-card',
                          )}
                        >
                          <AssetPreview asset={asset} />
                          <div className="p-2">
                            <span className="block truncate text-xs font-medium text-foreground">
                              {asset.fileName}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-signal-500 text-ink-950 shadow-md">
                              <Check className="size-3.5 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {selectedAsset && (
                    <div className="mt-4 space-y-3 rounded-2xl border border-border bg-ink-950/40 p-4">
                      <div>
                        <Label htmlFor="lib-alt" className="text-xs font-medium">
                          Alt text / chú thích ảnh (tiếng Anh)
                        </Label>
                        <Input
                          id="lib-alt"
                          value={libraryAlt}
                          onChange={(e) => setLibraryAlt(e.target.value)}
                          placeholder="Image description"
                          className="mt-1 text-sm"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleLibrarySubmit}
                        className="bg-brand-gradient flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-on-gradient hover:opacity-90"
                      >
                        <Check className="size-4" /> Chèn ảnh đã chọn
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 3: DIRECT URL */}
          {tab === 'url' && (
            <div className="space-y-4 rounded-2xl border border-border bg-ink-950/40 p-4">
              <div>
                <Label htmlFor="direct-url" className="text-xs font-medium">
                  URL ảnh *
                </Label>
                <Input
                  id="direct-url"
                  value={directUrl}
                  onChange={(e) => setDirectUrl(e.target.value)}
                  placeholder="https://example.com/image.webp"
                  className="mt-1 text-sm font-mono"
                />
              </div>

              <div>
                <Label htmlFor="url-alt" className="text-xs font-medium">
                  Alt text / chú thích ảnh (tiếng Anh)
                </Label>
                <Input
                  id="url-alt"
                  value={urlAlt}
                  onChange={(e) => setUrlAlt(e.target.value)}
                  placeholder="e.g. Retail store interactive display"
                  className="mt-1 text-sm"
                />
              </div>

              {directUrl.trim() && (
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">Xem trước:</span>
                  <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-ink-950">
                    <img
                      src={directUrl.trim()}
                      alt={urlAlt || 'Xem trước'}
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={!directUrl.trim()}
                onClick={handleUrlSubmit}
                className="bg-brand-gradient flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-on-gradient hover:opacity-90 disabled:opacity-50"
              >
                <Check className="size-4" /> Chèn ảnh từ URL vào bài
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
