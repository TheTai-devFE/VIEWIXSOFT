import { createServerEntry, createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server'
import { resolveRedirect, setActiveSlugMap } from '~/lib/slugs'
import { loadSiteConfig } from '~/server/site/config'

const startFetch = createStartHandler(defaultStreamHandler)

/**
 * Custom server entry: checks dynamic 301 redirects and warms the active slug
 * map for TanStack Router's `rewrite` before rendering SSR HTML.
 */
async function fetch(request: Request): Promise<Response> {
  if (request.method === 'GET' || request.method === 'HEAD') {
    const url = new URL(request.url)
    const config = await loadSiteConfig()
    setActiveSlugMap(config.slugs)

    const target = resolveRedirect(url.pathname, config.slugs, config.redirects, url.search)
    if (target) {
      return new Response(null, {
        status: 301,
        headers: {
          Location: target,
          'Cache-Control': 'public, max-age=300',
        },
      })
    }
  }
  return startFetch(request)
}

export default createServerEntry({ fetch })
