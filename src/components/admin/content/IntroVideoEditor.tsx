import { revalidateLogic, useForm, useStore } from '@tanstack/react-form'
import { Link } from '@tanstack/react-router'
import { Captions, Clapperboard, ImagePlus, Trash2 } from 'lucide-react'
import { useImperativeHandle, useRef, useState } from 'react'
import type { Ref } from 'react'
import { buttonPrimary, buttonSecondary, firstError } from '~/components/admin/admin-ui'
import type { EditorHandle, SaveResult } from '~/components/admin/admin-ui'
import { ContentField } from '~/components/admin/content/ContentField'
import { ImagePickerSheet } from '~/components/admin/ImagePickerSheet'
import type { LibraryAsset } from '~/components/admin/ImagePickerSheet'
import { useReportDirty } from '~/hooks/use-save-all'
import { cn } from '~/lib/cn'
import { IntroVideoContentSchema, SECTION_CONTENT } from '~/lib/section-content'
import type { IntroVideoContent } from '~/lib/section-content'
import { sendMediaUpload } from '~/lib/media-upload'
import { saveSectionContentFn } from '~/server/functions/site-admin'

const KEY = 'product-cms:intro-video'
const DEFAULTS = SECTION_CONTENT[KEY].defaults

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/**
 * The product tour on the Viewixsoft CMS page: a video and poster frame from
 * the library in /admin/media, captions for that video, and the text search
 * engines read. Changes show on the site after Save.
 */
export function IntroVideoEditor({
  initial,
  assets,
  ref,
  onDirtyChange,
}: {
  initial: IntroVideoContent
  assets: LibraryAsset[]
  ref?: Ref<EditorHandle>
  onDirtyChange?: (dirty: boolean) => void
}) {
  const result = useRef<SaveResult | null>(null)
  const captionsInput = useRef<HTMLInputElement>(null)
  const [picking, setPicking] = useState<'video' | 'poster' | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: initial,
    validationLogic: revalidateLogic({ mode: 'submit', modeAfterSubmission: 'change' }),
    validators: { onDynamic: IntroVideoContentSchema },
    onSubmit: async ({ value }) => {
      try {
        // Content equal to the defaults is stored as "no override", so later code changes still show.
        const content = same(value, DEFAULTS) ? null : value
        const res = await saveSectionContentFn({ data: { key: KEY, content } })
        result.current = res.ok ? { ok: true } : { ok: false, error: res.error }
      } catch {
        result.current = { ok: false, error: 'Product tour could not be saved. Check your connection.' }
      }
    },
  })

  const values = useStore(form.store, (s) => s.values)
  const attempted = useStore(form.store, (s) => s.submissionAttempts > 0)
  const dirty = !same(values, initial)
  useReportDirty(dirty, onDirtyChange)

  useImperativeHandle(
    ref,
    () => ({
      save: async () => {
        if (!dirty) return null
        if (progress !== null) return { ok: false, error: 'Wait for the upload to finish, then save.' }
        result.current = null
        await form.handleSubmit()
        // onSubmit does not run when validation fails, so no result means invalid fields.
        return result.current ?? { ok: false, error: 'Fix the highlighted fields in Product tour.' }
      },
    }),
    [dirty, form, progress],
  )

  const onCaptionsChosen = async (file: File | undefined) => {
    if (!file) return
    setUploadError(null)
    const body = new FormData()
    body.set('kind', 'captions')
    body.set('file', file)
    setProgress(0)
    const res = await sendMediaUpload(body, setProgress)
    setProgress(null)
    if (!res.ok) setUploadError(res.error)
    else if (res.kind === 'captions') form.setFieldValue('captions', res.file)
  }

  const errorOf = (errors: unknown[]) => (attempted ? firstError(errors) : undefined)
  const { video, poster, captions } = values
  const videoAsset = video ? assets.find((a) => a.id === video.assetId) : undefined
  const busy = progress !== null

  return (
    // Enter in a field saves through the header button's handler, not a second path.
    <form noValidate onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <p className="rounded-lg bg-ink-950 px-3 py-2 text-xs text-ink-400">
        The video under the opening section of the Viewixsoft CMS page. With no video the section is hidden. Upload
        videos in{' '}
        <Link to="/admin/media" className="font-medium text-signal-400 underline-offset-2 hover:underline">
          Media
        </Link>
        , then pick one here.
      </p>
      <input
        ref={captionsInput}
        type="file"
        accept=".vtt,text/vtt"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          void onCaptionsChosen(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      <section aria-labelledby="intro-video-file" className="space-y-3">
        <h3 id="intro-video-file" className="text-sm font-semibold text-ink-200">
          Video
        </h3>
        {video ? (
          <div className="overflow-hidden rounded-xl border border-ink-800">
            <video
              key={video.url}
              src={video.url}
              poster={poster?.url}
              controls
              preload="metadata"
              width={video.width}
              height={video.height}
              className="aspect-video w-full bg-ink-950 object-contain"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-800 px-4 py-3">
              <p className="min-w-0 truncate text-xs text-ink-400">
                <span className="font-medium text-ink-200">{videoAsset?.fileName ?? 'Library video'}</span> · {video.width}{' '}
                × {video.height}
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPicking('video')} className={buttonSecondary}>
                  <Clapperboard aria-hidden="true" className="size-4" />
                  Change video
                </button>
                <button
                  type="button"
                  onClick={() => form.setFieldValue('video', null)}
                  className={cn(buttonSecondary, 'hover:text-destructive')}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-ink-700 px-6 py-10 text-center">
            <p className="text-sm text-ink-300">No video yet, so the section is hidden on the site.</p>
            <button type="button" onClick={() => setPicking('video')} className={buttonPrimary}>
              <Clapperboard aria-hidden="true" className="size-4" />
              Choose a video
            </button>
          </div>
        )}
      </section>


      <div className="grid gap-4 sm:grid-cols-2">
        <section aria-labelledby="intro-video-poster" className="space-y-2">
          <h3 id="intro-video-poster" className="text-sm font-semibold text-ink-200">
            Poster frame
          </h3>
          <p className="text-xs text-muted-foreground">Shown before play and in search results. Same 16:9 shape as the video.</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPicking('poster')}
              aria-label={poster ? 'Change the poster frame' : 'Choose a poster frame'}
              className="group flex aspect-video w-36 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink-700 bg-ink-950 hover:border-ink-500"
            >
              {poster ? (
                <img src={poster.url} alt="" width={poster.width} height={poster.height} className="size-full object-cover" />
              ) : (
                <ImagePlus aria-hidden="true" className="size-5 text-ink-500 group-hover:text-ink-300" />
              )}
            </button>
            {poster && (
              <button type="button" onClick={() => form.setFieldValue('poster', null)} className={cn(buttonSecondary, 'h-8 text-xs')}>
                Remove
                <span className="sr-only"> poster frame</span>
              </button>
            )}
          </div>
        </section>

        <section aria-labelledby="intro-video-captions" className="space-y-2">
          <h3 id="intro-video-captions" className="text-sm font-semibold text-ink-200">
            Captions
          </h3>
          <p className="text-xs text-muted-foreground">A WebVTT (.vtt) file. Needed when the video has speech.</p>
          {captions ? (
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate font-mono text-xs text-ink-300">{captions.fileName}</p>
              <button type="button" disabled={busy} onClick={() => captionsInput.current?.click()} className={cn(buttonSecondary, 'h-8 text-xs')}>
                Replace
                <span className="sr-only"> captions</span>
              </button>
              <button type="button" onClick={() => form.setFieldValue('captions', null)} className={cn(buttonSecondary, 'h-8 text-xs')}>
                Remove
                <span className="sr-only"> captions</span>
              </button>
            </div>
          ) : (
            <button type="button" disabled={busy} onClick={() => captionsInput.current?.click()} className={buttonSecondary}>
              <Captions aria-hidden="true" className="size-4" />
              {busy ? `Uploading… ${Math.round((progress ?? 0) * 100)}%` : 'Upload captions'}
            </button>
          )}
          {uploadError && (
            <p role="alert" className="text-xs text-destructive">
              {uploadError}
            </p>
          )}
        </section>
      </div>

      <div className="space-y-4">
        <form.Field name="title">
          {(field) => (
            <ContentField
              id="intro-video-title-field"
              label="Video title"
              hint="Read out on the play button and shown in search results. Not shown on the page."
              className="max-w-md"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              error={errorOf(field.state.meta.errors)}
            />
          )}
        </form.Field>
        <form.Field name="description">
          {(field) => (
            <ContentField
              id="intro-video-description"
              label="Video description"
              hint="What the video shows, for search engines. Not shown on the page."
              rows={2}
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              error={errorOf(field.state.meta.errors)}
            />
          )}
        </form.Field>
      </div>

      <ImagePickerSheet
        open={picking === 'video'}
        onClose={() => setPicking(null)}
        assets={assets}
        kind="video"
        currentId={video?.assetId}
        description="MP4 or WebM from the library, 1920 × 1080 or 1280 × 720."
        onPick={(a) =>
          form.setFieldValue('video', {
            assetId: a.id,
            url: a.url,
            width: a.width,
            height: a.height,
            uploadedAt: new Date(a.createdAt).toISOString().slice(0, 10),
          })
        }
      />
      <ImagePickerSheet
        open={picking === 'poster'}
        onClose={() => setPicking(null)}
        assets={assets}
        currentId={poster?.assetId}
        description="Poster frame, 16:9 WebP or JPEG, 1920 × 1080 or 1280 × 720."
        onPick={(a) => form.setFieldValue('poster', { assetId: a.id, url: a.url, width: a.width, height: a.height })}
      />
    </form>
  )
}
