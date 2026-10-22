import { useRouter } from '@tanstack/react-router'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { z } from 'zod'
import { buttonPrimary, buttonSecondary, firstError, SaveStatus } from '~/components/admin/admin-ui'
import type { SaveState } from '~/components/admin/admin-ui'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '~/data/media-slots'
import type { MediaSlot } from '~/data/media-slots'
import { resetMediaFn, updateMediaAltFn, uploadMediaFn } from '~/server/functions/media-admin'

const UploadSchema = z.object({
  alt: z.string().trim().min(3, 'Describe the image in a few words').max(200),
  file: z
    .instanceof(File)
    .nullable()
    .refine((f) => !f || ALLOWED_IMAGE_TYPES.some((t) => t === f.type), 'Use a WebP, AVIF, JPEG or PNG image')
    .refine((f) => !f || f.size <= MAX_IMAGE_BYTES, 'Keep images under 1.5 MB'),
})

interface Current {
  url: string
  alt: string
  width: number
  height: number
}

/** One replaceable image: preview, file picker, alt text and reset. */
export function MediaSlotCard({ slot, current }: { slot: MediaSlot; current?: Current }) {
  const router = useRouter()
  const [state, setState] = useState<SaveState>({ kind: 'idle' })
  const shown = current ?? (slot.fallback ? { url: slot.fallback.src, ...slot.fallback } : null)
  const id = (f: string) => `media-${slot.key.replace(/\./g, '-')}-${f}`

  const form = useForm({
    defaultValues: { alt: current?.alt ?? slot.fallback?.alt ?? '', file: null as File | null },
    validationLogic: revalidateLogic({ mode: 'submit', modeAfterSubmission: 'change' }),
    validators: { onDynamic: UploadSchema },
    onSubmit: async ({ value }) => {
      setState({ kind: 'saving' })
      try {
        let res: { ok: true } | { ok: false; error: string }
        if (value.file) {
          const data = new FormData()
          data.set('key', slot.key)
          data.set('alt', value.alt)
          data.set('file', value.file)
          res = await uploadMediaFn({ data })
        } else if (current) {
          res = await updateMediaAltFn({ data: { key: slot.key, alt: value.alt } })
        } else {
          res = { ok: false, error: 'Choose an image to upload.' }
        }
        if (!res.ok) return setState({ kind: 'error', message: res.error })
        setState({ kind: 'saved' })
        form.setFieldValue('file', null)
        await router.invalidate()
      } catch {
        setState({ kind: 'error', message: 'Upload failed. Check your connection and try again.' })
      }
    },
  })

  return (
    <li className="rounded-xl border border-ink-800 bg-ink-950 p-4">
      <div className="aspect-video overflow-hidden rounded-lg border border-ink-800 bg-ink-900">
        {shown ? (
          <img src={shown.url} alt={shown.alt} width={shown.width} height={shown.height} loading="lazy" className="size-full object-cover" />
        ) : (
          <p className="flex size-full items-center justify-center text-xs text-ink-500">No image yet</p>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink-50">{slot.label}</h3>
        <span className="shrink-0 rounded-full bg-ink-850 px-2 py-0.5 font-mono text-[10px] tracking-wider text-ink-400 uppercase">
          {current ? `Custom · ${current.width}×${current.height}` : 'Default'}
        </span>
      </div>
      <p className="mt-1 text-xs text-ink-500">{slot.guidance}</p>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void form.handleSubmit()
        }}
        className="mt-4 space-y-3"
      >
        <form.Field name="file">
          {(field) => {
            const error = form.state.submissionAttempts > 0 ? firstError(field.state.meta.errors) : undefined
            return (
              <div>
                <Label htmlFor={id('file')}>New image</Label>
                <input
                  id={id('file')}
                  type="file"
                  accept={ALLOWED_IMAGE_TYPES.join(',')}
                  onChange={(e) => field.handleChange(e.target.files?.[0] ?? null)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? id('file-error') : undefined}
                  className="mt-1.5 block w-full text-xs text-ink-300 file:mr-3 file:rounded-md file:border file:border-ink-700 file:bg-ink-900 file:px-3 file:py-1.5 file:text-ink-100"
                />
                {error && (
                  <p id={id('file-error')} className="mt-1 text-xs text-destructive">
                    {error}
                  </p>
                )}
              </div>
            )
          }}
        </form.Field>
        <form.Field name="alt">
          {(field) => {
            const error = form.state.submissionAttempts > 0 ? firstError(field.state.meta.errors) : undefined
            return (
              <div>
                <Label htmlFor={id('alt')}>Alt text</Label>
                <Input
                  id={id('alt')}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? id('alt-error') : undefined}
                  className="mt-1.5 h-9 bg-ink-900 text-ink-50"
                />
                {error && (
                  <p id={id('alt-error')} className="mt-1 text-xs text-destructive">
                    {error}
                  </p>
                )}
              </div>
            )
          }}
        </form.Field>
        <div className="flex flex-wrap items-center gap-2">
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <button type="submit" disabled={isSubmitting} className={buttonPrimary}>
                Save
              </button>
            )}
          </form.Subscribe>
          {current && (
            <button
              type="button"
              className={buttonSecondary}
              onClick={async () => {
                if (!window.confirm('Go back to the default image?')) return
                setState({ kind: 'saving' })
                const res = await resetMediaFn({ data: { key: slot.key } })
                if (!res.ok) return setState({ kind: 'error', message: res.error })
                setState({ kind: 'saved' })
                await router.invalidate()
              }}
            >
              Use default
            </button>
          )}
        </div>
        <SaveStatus state={state} />
      </form>
    </li>
  )
}
