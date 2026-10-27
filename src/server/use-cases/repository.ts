import { desc, eq, sql } from 'drizzle-orm'
import { getDb } from '~/server/db/client'
import { useCases } from '~/server/db/schema'
import type { NewUseCase, UseCaseRow } from '~/server/db/schema'
import type { UseCaseFormInput } from '~/lib/admin-schemas'
import { USE_CASES } from '~/content/useCases'

let seeded = false

export async function seedDefaultUseCasesIfEmpty(): Promise<void> {
  if (seeded) return
  try {
    const existing = await getDb().select({ count: sql<number>`count(*)` }).from(useCases)
    if (Number(existing[0]?.count ?? 0) === 0) {
      const now = new Date()
      const rows = USE_CASES.map((u) => ({
        slug: u.slug,
        title: u.title,
        seoTitle: u.seoTitle,
        industry: u.industry,
        tagline: u.tagline,
        coverUrl: u.cover.src,
        coverAlt: u.cover.alt,
        challengeHeading: u.challengeHeading,
        challenge: u.challenge,
        solutionHeading: u.solutionHeading,
        solution: u.solution,
        results: u.results,
        quote: u.quote,
        featuredProducts: u.featuredProducts,
        status: 'published' as const,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      }))
      await getDb().insert(useCases).values(rows).onConflictDoNothing()
    }
    seeded = true
  } catch {
    // If DB is temporarily unavailable, allow query to proceed without failing seed
  }
}

export async function listAllUseCases(): Promise<UseCaseRow[]> {
  await seedDefaultUseCasesIfEmpty()
  return getDb().select().from(useCases).orderBy(desc(useCases.createdAt))
}

export async function listPublishedUseCases(): Promise<UseCaseRow[]> {
  await seedDefaultUseCasesIfEmpty()
  return getDb()
    .select()
    .from(useCases)
    .where(eq(useCases.status, 'published'))
    .orderBy(desc(useCases.publishedAt), desc(useCases.createdAt))
}

export async function getUseCaseById(id: string): Promise<UseCaseRow | null> {
  const [row] = await getDb().select().from(useCases).where(eq(useCases.id, id))
  return row ?? null
}

export async function getUseCaseBySlug(slug: string): Promise<UseCaseRow | null> {
  await seedDefaultUseCasesIfEmpty()
  const [row] = await getDb().select().from(useCases).where(eq(useCases.slug, slug))
  return row ?? null
}

/** Maps the fields present in a form input to columns; optional texts are stored as null when empty. */
function toColumns(input: Partial<UseCaseFormInput>): Partial<NewUseCase> {
  const cols: Partial<NewUseCase> = {}
  const set = <K extends keyof NewUseCase>(key: K, value: NewUseCase[K] | undefined) => {
    if (value !== undefined) cols[key] = value
  }
  const orNull = (value: string | undefined) => (value === undefined ? undefined : value || null)

  set('slug', input.slug)
  set('title', input.title)
  set('seoTitle', orNull(input.seoTitle))
  set('industry', input.industry)
  set('tagline', input.tagline)
  set('coverUrl', orNull(input.coverUrl))
  set('coverAlt', orNull(input.coverAlt))
  set('results', input.results)
  if (input.quote !== undefined) cols.quote = input.quote || null
  set('featuredProducts', input.featuredProducts)
  set('mode', input.mode)
  set('highlights', input.highlights)
  set('sections', input.sections)
  // Sections replace the old challenge/solution text; clearing it stops it coming back as fallback sections.
  if (input.sections !== undefined) {
    cols.challenge = ''
    cols.solution = ''
  }
  set('stories', input.stories)
  set('setup', input.setup)
  set('faq', input.faq)
  if (input.reviewedBy !== undefined) cols.reviewedBy = input.reviewedBy || null
  return cols
}

/** `userId` becomes the case study's owner and last editor. */
export async function createUseCase(input: UseCaseFormInput, userId: string): Promise<UseCaseRow> {
  const isPublished = input.status === 'published'
  const [row] = await getDb()
    .insert(useCases)
    .values({
      ...toColumns(input),
      slug: input.slug,
      title: input.title,
      industry: input.industry,
      tagline: input.tagline,
      status: input.status,
      publishedAt: isPublished ? new Date() : null,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning()
  if (!row) throw new Error('Failed to insert use case')
  return row
}

export async function updateUseCase(id: string, input: Partial<UseCaseFormInput>, userId: string): Promise<UseCaseRow | null> {
  const existing = await getUseCaseById(id)
  if (!existing) return null

  const updateData: Partial<NewUseCase> = { ...toColumns(input), updatedAt: new Date(), updatedBy: userId }
  if (input.status !== undefined) {
    updateData.status = input.status
    updateData.publishedAt = input.status === 'published' && !existing.publishedAt ? new Date() : existing.publishedAt
  }

  const [row] = await getDb().update(useCases).set(updateData).where(eq(useCases.id, id)).returning()
  return row ?? null
}

export async function deleteUseCase(id: string): Promise<boolean> {
  const result = await getDb().delete(useCases).where(eq(useCases.id, id)).returning({ id: useCases.id })
  return result.length > 0
}
