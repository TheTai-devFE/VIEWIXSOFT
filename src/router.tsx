import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { DefaultCatchBoundary } from './components/DefaultCatchBoundary'
import { NotFound } from './components/NotFound'
import { getActiveSlugMap, rewriteInputUrl, rewriteOutputUrl } from './lib/slugs'

export function getRouter() {
  const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
    scrollRestoration: true,
    rewrite: {
      input: ({ url }) => rewriteInputUrl(url, getActiveSlugMap()),
      output: ({ url }) => rewriteOutputUrl(url, getActiveSlugMap()),
    },
  })
  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
