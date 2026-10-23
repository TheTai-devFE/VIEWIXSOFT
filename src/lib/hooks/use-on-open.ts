import { useState } from 'react'

/**
 * Runs `start` during the render in which `open` becomes true, so a fresh list
 * session (highlight back at the top) never carries the last one's state.
 * `start` may only set state belonging to the calling component.
 */
export function useOnOpen(open: boolean, start: () => void) {
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) start()
  }
}
