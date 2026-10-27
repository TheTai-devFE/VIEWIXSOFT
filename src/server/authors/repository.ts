import '@tanstack/react-start/server-only'
import { asc, eq } from 'drizzle-orm'
import { getDb } from '~/server/db/client'
import { authors } from '~/server/db/schema'
import type { AuthorRow } from '~/server/db/schema'
import type { AuthorFormInput } from '~/lib/admin-schemas'

export async function listAuthors(): Promise<AuthorRow[]> {
  return getDb().select().from(authors).orderBy(asc(authors.name))
}

export async function getAuthorById(id: string): Promise<AuthorRow | null> {
  const [row] = await getDb().select().from(authors).where(eq(authors.id, id))
  return row ?? null
}

/** The author profile an account writes as, if one is linked. */
export async function getAuthorByUserId(userId: string): Promise<AuthorRow | null> {
  const [row] = await getDb().select().from(authors).where(eq(authors.userId, userId))
  return row ?? null
}

export async function getAuthorBySlug(slug: string): Promise<AuthorRow | null> {
  const [row] = await getDb().select().from(authors).where(eq(authors.slug, slug))
  return row ?? null
}

const columns = (input: AuthorFormInput) => ({
  slug: input.slug,
  name: input.name,
  role: input.role,
  bio: input.bio,
  avatarUrl: input.avatarUrl || null,
  profileUrl: input.profileUrl || null,
  kind: input.kind,
  userId: input.userId,
})

export async function createAuthor(input: AuthorFormInput): Promise<AuthorRow> {
  const [row] = await getDb().insert(authors).values(columns(input)).returning()
  if (!row) throw new Error('Failed to insert author')
  return row
}

export async function updateAuthor(id: string, input: AuthorFormInput): Promise<AuthorRow | null> {
  const [row] = await getDb()
    .update(authors)
    .set({ ...columns(input), updatedAt: new Date() })
    .where(eq(authors.id, id))
    .returning()
  return row ?? null
}

/** Posts by this author keep their byline text; their author link is cleared by the foreign key. */
export async function deleteAuthor(id: string): Promise<boolean> {
  const result = await getDb().delete(authors).where(eq(authors.id, id)).returning({ id: authors.id })
  return result.length > 0
}
