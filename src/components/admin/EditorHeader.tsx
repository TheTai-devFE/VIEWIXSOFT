import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { AnimatedBadge } from '~/components/ui/animated-badge'

/**
 * The top bar of an admin editor: back, title, publishing status and the
 * save actions. It sticks while the long form scrolls, so the status and the
 * Publish button stay in view.
 */
export function EditorHeader({
  title,
  backLabel,
  onBack,
  status,
  publishedAt,
  badges,
  actions,
}: {
  title: string
  backLabel: string
  onBack: () => void
  /** Undefined for a page that has not been saved yet. */
  status: 'published' | 'draft' | undefined
  publishedAt?: Date | string | null
  /** Extra badges beside the status, such as the SEO score. */
  badges?: ReactNode
  actions: ReactNode
}) {
  return (
    <div className="sticky top-16 z-20 -mx-4 -mt-8 border-b border-border bg-background/90 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-10 lg:-mt-10 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-muted"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </button>
          <div className="min-w-0 space-y-1.5">
            <h1 className="truncate font-display text-xl font-semibold tracking-tight text-foreground">{title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              {status === 'published' && <AnimatedBadge status="success" size="sm">Đã đăng</AnimatedBadge>}
              {status === 'draft' && <AnimatedBadge status="warning" size="sm">Bản nháp</AnimatedBadge>}
              {status === undefined && <AnimatedBadge status="neutral" size="sm">Chưa lưu</AnimatedBadge>}
              {publishedAt && (
                <span className="text-xs text-muted-foreground">Đăng ngày {new Date(publishedAt).toLocaleDateString('vi-VN')}</span>
              )}
              {badges}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      </div>
    </div>
  )
}
