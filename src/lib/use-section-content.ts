import { useMemo } from 'react'
import { resolveSectionContent } from '~/lib/section-content'
import type { SectionContentKey } from '~/lib/section-content'
import { useSiteConfig } from '~/lib/use-site-config'

/** A section's content as edited in /admin/pages, else its defaults from the code. */
export function useSectionContent<K extends SectionContentKey>(key: K) {
  const { content } = useSiteConfig()
  const stored = content[key]
  return useMemo(() => resolveSectionContent(key, stored), [key, stored])
}
