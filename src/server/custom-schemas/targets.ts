import '@tanstack/react-start/server-only'
import { BLOG_POSTS } from '~/content/blog'
import { USE_CASES } from '~/content/useCases'
import { ADMIN_PAGES } from '~/data/admin-pages'
import { listAllBlogPosts } from '~/server/blog/repository'
import { hasDatabase } from '~/server/db/client'
import { listAllUseCases } from '~/server/use-cases/repository'

export interface SchemaTarget {
  path: string
  label: string
  kind: 'page' | 'blog' | 'case-study'
}

/**
 * Every page a custom schema can be attached to: the fixed pages, then each
 * blog post and case study (drafts too, so markup can be ready before launch).
 */
export async function listSchemaTargets(): Promise<SchemaTarget[]> {
  const [posts, cases] = hasDatabase() ? await Promise.all([listAllBlogPosts(), listAllUseCases()]) : [[], []]
  const targets = new Map<string, SchemaTarget>()
  const add = (t: SchemaTarget) => {
    if (!targets.has(t.path)) targets.set(t.path, t)
  }
  for (const p of ADMIN_PAGES) add({ path: p.path, label: p.label, kind: 'page' })
  for (const p of posts) add({ path: `/blog/${p.slug}`, label: p.title, kind: 'blog' })
  for (const p of BLOG_POSTS) add({ path: `/blog/${p.slug}`, label: p.title, kind: 'blog' })
  for (const c of cases) add({ path: `/case-studies/${c.slug}`, label: c.title, kind: 'case-study' })
  for (const c of USE_CASES) add({ path: `/case-studies/${c.slug}`, label: c.title, kind: 'case-study' })
  return [...targets.values()]
}

export async function isSchemaTarget(path: string) {
  return (await listSchemaTargets()).some((t) => t.path === path)
}
