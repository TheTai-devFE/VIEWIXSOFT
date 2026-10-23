/**
 * Permanent (301) redirects for pages that moved or were removed, so old
 * links and search results keep working. Add one whenever a slug changes or a
 * page is deleted (AGENTS.md §8). Keys and targets are site paths.
 */
export const REDIRECTS: Record<string, string> = {
  // Use cases removed on 2026-10-22; their industry is not covered any more.
  '/use-cases/transportation': '/use-cases',
  '/use-cases/dooh-advertising': '/use-cases',
}

/** Where an old path now lives, if it moved; also covers its Markdown twin (`.md`). */
export function redirectFor(path: string): string | null {
  const clean = path.replace(/\/$/, '')
  return REDIRECTS[clean] ?? REDIRECTS[clean.replace(/\.md$/, '')] ?? null
}
