import type { ActivityAction } from '~/lib/activity'

type Status = 'draft' | 'published'

/** A save that also changes the status is logged as the publish or unpublish it is. */
export function statusAction(entity: 'blog' | 'use-case', before: Status, after: Status): ActivityAction {
  if (before !== after) return after === 'published' ? `${entity}.publish` : `${entity}.unpublish`
  return `${entity}.update`
}
