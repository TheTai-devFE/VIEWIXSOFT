import { Link } from '@tanstack/react-router'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '~/lib/cn'

/**
 * How MDX elements render inside a blog post. Headings keep the ids added by
 * remark-blog-meta so the table of contents can link to them.
 */
function A({ href = '', className, ...props }: ComponentPropsWithoutRef<'a'>) {
  const cls = cn('font-medium text-signal-400 underline underline-offset-2 hover:text-signal-300', className)
  if (href.startsWith('/') && !href.startsWith('//')) return <Link to={href} className={cls} {...props} />
  if (href.startsWith('#')) return <a href={href} className={cls} {...props} />
  return <a href={href} target="_blank" rel="noopener noreferrer" className={cls} {...props} />
}

export const MDX_COMPONENTS = {
  h2: (p: ComponentPropsWithoutRef<'h2'>) => (
    <h2
      {...p}
      className="scroll-mt-24 border-b border-ink-800 pt-8 pb-3 font-display text-2xl font-semibold tracking-tight text-ink-50 sm:text-3xl"
    />
  ),
  h3: (p: ComponentPropsWithoutRef<'h3'>) => (
    <h3 {...p} className="scroll-mt-24 pt-4 font-display text-xl font-semibold text-ink-50" />
  ),
  h4: (p: ComponentPropsWithoutRef<'h4'>) => <h4 {...p} className="pt-2 font-semibold text-ink-50" />,
  p: (p: ComponentPropsWithoutRef<'p'>) => <p {...p} className="leading-relaxed text-ink-300" />,
  a: A,
  ul: (p: ComponentPropsWithoutRef<'ul'>) => (
    <ul {...p} className="list-disc space-y-2 pl-6 text-ink-300 marker:text-signal-400" />
  ),
  ol: (p: ComponentPropsWithoutRef<'ol'>) => (
    <ol {...p} className="list-decimal space-y-2 pl-6 text-ink-300 marker:text-signal-400" />
  ),
  li: (p: ComponentPropsWithoutRef<'li'>) => <li {...p} className="pl-1 leading-relaxed" />,
  strong: (p: ComponentPropsWithoutRef<'strong'>) => <strong {...p} className="font-semibold text-ink-50" />,
  blockquote: (p: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote {...p} className="border-l-4 border-signal-500 pl-4 text-ink-200 italic" />
  ),
  code: (p: ComponentPropsWithoutRef<'code'>) => (
    <code {...p} className="rounded bg-ink-900 px-1.5 py-0.5 font-mono text-sm text-ink-100" />
  ),
  pre: (p: ComponentPropsWithoutRef<'pre'>) => (
    <pre
      {...p}
      className="overflow-x-auto rounded-xl border border-ink-800 bg-ink-900 p-4 text-sm [&_code]:bg-transparent [&_code]:p-0"
    />
  ),
  table: (p: ComponentPropsWithoutRef<'table'>) => (
    <div className="overflow-x-auto rounded-xl border border-ink-800">
      <table {...p} className="w-full border-collapse text-left text-sm" />
    </div>
  ),
  th: (p: ComponentPropsWithoutRef<'th'>) => (
    <th {...p} className="border-b border-ink-800 bg-ink-900 px-4 py-2 font-semibold text-ink-50" />
  ),
  td: (p: ComponentPropsWithoutRef<'td'>) => <td {...p} className="border-b border-ink-800 px-4 py-2 text-ink-300" />,
  hr: () => <hr className="border-ink-800" />,
  img: ({ alt = '', ...p }: ComponentPropsWithoutRef<'img'>) => (
    <img alt={alt} loading="lazy" decoding="async" {...p} className="rounded-xl border border-ink-800" />
  ),
}
