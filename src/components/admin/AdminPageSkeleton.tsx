import { useEffect, useState } from 'react'

function Bar({ className }: { className: string }) {
  return <div className={`rounded-md bg-muted/70 ${className}`} />
}

/** Placeholder shaped like an admin page (header, then cards) while the next page loads. */
export function AdminPageSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse space-y-8 motion-reduce:animate-none">
      <div className="space-y-3">
        <Bar className="h-8 w-56" />
        <Bar className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-4 rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-muted/70" />
              <div className="flex-1 space-y-2">
                <Bar className="h-4 w-1/3" />
                <Bar className="h-3 w-1/2" />
              </div>
            </div>
            <Bar className="h-3 w-full" />
            <Bar className="h-3 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** True only once `active` has lasted `delayMs`, so fast page loads don't flash a skeleton. */
export function useDelayedFlag(active: boolean, delayMs = 150) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (!active) {
      setShown(false)
      return
    }
    const timer = setTimeout(() => setShown(true), delayMs)
    return () => clearTimeout(timer)
  }, [active, delayMs])
  return shown
}
