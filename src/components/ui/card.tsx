// Adapted from beUI (beui.dev/components/motion/card): the static parts only,
// without the press feedback, which the admin panels do not need.
import type { ComponentPropsWithRef } from 'react'
import { cn } from '~/lib/cn'

export function Card({ className, ...props }: ComponentPropsWithRef<'section'>) {
  return (
    <section
      {...props}
      data-slot="card"
      className={cn('relative flex flex-col gap-4 rounded-2xl border border-border bg-card py-5 text-card-foreground', className)}
    />
  )
}

/** Title and description, with an optional CardAction pinned to the top right. */
export function CardHeader({ className, ...props }: ComponentPropsWithRef<'div'>) {
  return (
    <div
      {...props}
      data-slot="card-header"
      className={cn(
        'grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-5',
        'has-data-[slot=card-action]:grid-cols-[1fr_auto]',
        className,
      )}
    />
  )
}

export function CardTitle({
  as: Tag = 'h3',
  className,
  ...props
}: ComponentPropsWithRef<'h3'> & { as?: 'h2' | 'h3' | 'h4' }) {
  return <Tag {...props} data-slot="card-title" className={cn('text-sm leading-snug font-semibold text-foreground', className)} />
}

export function CardDescription({ className, ...props }: ComponentPropsWithRef<'p'>) {
  return <p {...props} data-slot="card-description" className={cn('text-xs leading-relaxed text-muted-foreground', className)} />
}

/** Sits beside the title and description inside CardHeader. */
export function CardAction({ className, ...props }: ComponentPropsWithRef<'div'>) {
  return (
    <div
      {...props}
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 flex items-center self-start justify-self-end', className)}
    />
  )
}

export function CardContent({ className, ...props }: ComponentPropsWithRef<'div'>) {
  return <div {...props} data-slot="card-content" className={cn('px-5 text-sm', className)} />
}
