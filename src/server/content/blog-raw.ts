import '@tanstack/react-start/server-only'

// Markdown source of each post, for the .md twins and llms-full.txt. Server
// only, so the raw text never ships in the browser bundle.
const raw = import.meta.glob<string>('../../content/blog/*.mdx', { query: '?raw', import: 'default', eager: true })

/** The post body without frontmatter. */
export function postMarkdown(slug: string) {
  const source = raw[`../../content/blog/${slug}.mdx`]
  return source ? source.replace(/^---\n[\s\S]*?\n---\n/, '').trim() : null
}
