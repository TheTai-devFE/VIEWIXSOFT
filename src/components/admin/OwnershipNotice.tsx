import { Lock } from 'lucide-react'

export interface Ownership {
  createdBy: string | null
  updatedBy: string | null
  /** Account names by id, for the labels. */
  people: { id: string; name: string }[]
  /** False when the post belongs to someone else and you lack "Sửa bài của người khác". */
  canEdit: boolean
}

export function personName(people: Ownership['people'], id: string | null) {
  if (!id) return 'Không rõ'
  return people.find((p) => p.id === id)?.name ?? 'Tài khoản đã xoá'
}

/** Who owns a post and who saved it last; a read-only notice when you can't change it. */
export function OwnershipNotice({ ownership, kind }: { ownership: Ownership; kind: 'bài viết' | 'case study' }) {
  const owner = personName(ownership.people, ownership.createdBy)
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Tạo bởi <strong className="font-medium text-foreground">{owner}</strong>
        {ownership.updatedBy && (
          <>
            {' '}
            · Sửa lần cuối bởi <strong className="font-medium text-foreground">{personName(ownership.people, ownership.updatedBy)}</strong>
          </>
        )}
      </p>
      {!ownership.canEdit && (
        <p role="status" className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            Chỉ xem: {kind} này do {owner} tạo. Bạn cần quyền "Sửa bài của người khác" để sửa, đăng/gỡ hoặc xoá.
          </span>
        </p>
      )}
    </div>
  )
}
