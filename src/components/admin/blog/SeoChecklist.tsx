import { AlertTriangle, Check, X } from 'lucide-react'
import { AnimatedBadge } from '~/components/ui/animated-badge'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { checklistScore } from '~/lib/seo/post-checklist'
import type { CheckStatus, PostCheck } from '~/lib/seo/post-checklist'
import { cn } from '~/lib/cn'

const ICON = { pass: Check, warn: AlertTriangle, fail: X } satisfies Record<CheckStatus, unknown>
const TONE: Record<CheckStatus, string> = { pass: 'text-success', warn: 'text-warning', fail: 'text-destructive' }
const SR: Record<CheckStatus, string> = { pass: 'Đạt', warn: 'Nên sửa', fail: 'Cần sửa' }

/** The SEO / GEO score shown in the editor header; links down to the checklist. */
export function SeoScoreBadge({ checks }: { checks: PostCheck[] }) {
  const { passed, total, failed } = checklistScore(checks)
  let status: 'success' | 'warning' | 'danger' = 'success'
  if (failed > 0) status = 'danger'
  else if (passed < total) status = 'warning'
  return (
    <a href="#seo-checklist" className="rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
      <AnimatedBadge status={status} size="sm">
        SEO/GEO {passed}/{total}
      </AnimatedBadge>
    </a>
  )
}

/** Live checks while writing: what still keeps the post from ranking or being quoted by AI. */
export function SeoChecklist({ checks }: { checks: PostCheck[] }) {
  const { passed, total } = checklistScore(checks)
  // Problems first, so what to fix is at the top.
  const order: Record<CheckStatus, number> = { fail: 0, warn: 1, pass: 2 }
  const groups = [
    { id: 'seo', title: 'SEO (Google)' },
    { id: 'geo', title: 'GEO (ChatGPT, Perplexity, AI Overviews)' },
  ] as const

  return (
    <Card id="seo-checklist" className="scroll-mt-28">
      <CardHeader>
        <CardTitle>Kiểm tra SEO & GEO</CardTitle>
        <CardDescription>Cập nhật trực tiếp khi bạn viết.</CardDescription>
        <CardAction>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {passed}/{total}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-5">
        {groups.map((group) => (
          <div key={group.id}>
            <h4 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{group.title}</h4>
            <ul className="mt-2 space-y-2.5">
              {checks
                .filter((c) => c.group === group.id)
                .sort((a, b) => order[a.status] - order[b.status])
                .map((c) => {
                  const Icon = ICON[c.status]
                  return (
                    <li key={c.id} className="flex gap-2.5">
                      <Icon aria-hidden="true" className={cn('mt-0.5 size-3.5 shrink-0', TONE[c.status])} />
                      <div className="min-w-0">
                        <p className={cn('text-xs', c.status === 'pass' ? 'text-muted-foreground' : 'font-medium text-foreground')}>
                          <span className="sr-only">{SR[c.status]}: </span>
                          {c.label}
                        </p>
                        {c.hint && <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{c.hint}</p>}
                      </div>
                    </li>
                  )
                })}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
