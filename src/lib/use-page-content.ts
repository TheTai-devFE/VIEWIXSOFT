import { useMemo } from 'react'
import { pageContent } from '~/lib/page-content'
import { useSiteConfig } from '~/lib/use-site-config'

/** Hero and SEO text for a page, with the admin's search snippet overrides from /admin/seo. */
export function usePageContent(key: string) {
  const config = useSiteConfig()
  return useMemo(() => pageContent(config, key), [config, key])
}
