import { useEffect, useRef, useState } from 'react'
import type { ComponentProps } from 'react'
import { cn } from '~/lib/cn'

/**
 * An image that loads only near the viewport and pulses as a placeholder
 * until it arrives. For admin thumbnails and lists; public pages set their
 * own loading priority.
 */
export function LazyImage({ className, onLoad, onError, alt = '', ...props }: ComponentProps<'img'>) {
  const ref = useRef<HTMLImageElement>(null)
  const [settled, setSettled] = useState(false)

  // Server-rendered or cached images can finish before React attaches onLoad.
  useEffect(() => {
    if (ref.current?.complete) setSettled(true)
  }, [])

  return (
    <img
      ref={ref}
      alt={alt}
      loading="lazy"
      decoding="async"
      {...props}
      onLoad={(e) => {
        setSettled(true)
        onLoad?.(e)
      }}
      onError={(e) => {
        setSettled(true)
        onError?.(e)
      }}
      className={cn(!settled && 'animate-pulse bg-muted motion-reduce:animate-none', className)}
    />
  )
}
