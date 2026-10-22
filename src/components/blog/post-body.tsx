import { Suspense, use } from 'react'
import type { ComponentType } from 'react'
import { MDX_COMPONENTS } from '~/components/blog/mdx-components'
import { loadPostBody } from '~/content/blog'

type Body = ComponentType<{ components?: Record<string, unknown> }> | null
const cache = new Map<string, Promise<Body>>()

/**
 * One promise per post body. Once it resolves it is tagged the way React's
 * `use()` reads settled promises, so a route loader that awaited it lets the
 * server render the post synchronously (full text in the SSR HTML). During
 * hydration the browser waits for the chunk inside <Suspense> and keeps the
 * server HTML meanwhile.
 */
export function postBodyPromise(slug: string): Promise<Body> {
  const existing = cache.get(slug)
  if (existing) return existing
  const promise: Promise<Body> = loadPostBody(slug).then((body) => {
    Object.assign(promise, { status: 'fulfilled', value: body })
    return body
  })
  cache.set(slug, promise)
  return promise
}

function Content({ slug }: { slug: string }) {
  const Body = use(postBodyPromise(slug))
  return Body ? <Body components={MDX_COMPONENTS} /> : null
}

export function PostBody({ slug }: { slug: string }) {
  return (
    <Suspense fallback={null}>
      <Content slug={slug} />
    </Suspense>
  )
}
