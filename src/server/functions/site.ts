import { createServerFn } from '@tanstack/react-start'
import { loadSiteConfig } from '~/server/site/config'

/** Public site settings; the root route loads them for every page. */
export const getSiteConfigFn = createServerFn({ method: 'GET' }).handler(() => loadSiteConfig())
