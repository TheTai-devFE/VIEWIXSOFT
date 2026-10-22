/**
 * Blog authors, referenced by key from each post's frontmatter (`author:`).
 * Add a person only with their approval of the name, role, bio and photo; a
 * named expert with credentials helps E-E-A-T. `organization` bylines are
 * published as the Organization in JSON-LD.
 *
 * TODO(content): add real authors (name, role, short bio, square photo in
 * public/authors/, optional LinkedIn URL) and move posts to them.
 */
export interface Author {
  name: string
  role: string
  bio: string
  avatar: string
  kind: 'person' | 'organization'
  url?: string
}

export const AUTHORS = {
  'viewixsoft-team': {
    name: 'Viewixsoft Team',
    role: 'Product and engineering',
    bio: 'The team that builds Viewixsoft CMS and the software that runs on Viewix screens.',
    avatar: '/logo.png',
    kind: 'organization',
  },
} as const satisfies Record<string, Author>

export type AuthorKey = keyof typeof AUTHORS
export const AUTHOR_KEYS = Object.keys(AUTHORS) as [AuthorKey, ...AuthorKey[]]
