/**
 * Permanent (301) redirects for pages that moved or were removed, so old
 * links and search results keep working. Add one whenever a slug changes or a
 * page is deleted (AGENTS.md §8). Keys and targets are site paths.
 */
export const REDIRECTS: Record<string, string> = {
  '/use-cases': '/case-studies',
  '/use-cases/transportation': '/case-studies',
  '/use-cases/dooh-advertising': '/case-studies',
}

/** Where an old path now lives, if it moved; also covers its Markdown twin (`.md`). */
export function redirectFor(path: string): string | null {
  const clean = path.replace(/\/$/, '')
  return REDIRECTS[clean] ?? REDIRECTS[clean.replace(/\.md$/, '')] ?? null
}
