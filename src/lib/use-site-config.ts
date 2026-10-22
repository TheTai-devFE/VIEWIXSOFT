import { getRouteApi } from '@tanstack/react-router'
import { useMemo } from 'react'
import { visibleProducts } from '~/lib/site-config'
import type { SiteConfig } from '~/lib/site-config'

const rootApi = getRouteApi('__root__')

/** Admin site settings, loaded by the root route for every page. */
export function useSiteConfig(): SiteConfig {
  return rootApi.useLoaderData()
}

/** Products with the admin's release status; hidden products are left out. */
export function useProducts() {
  const config = useSiteConfig()
  return useMemo(() => visibleProducts(config), [config])
}
