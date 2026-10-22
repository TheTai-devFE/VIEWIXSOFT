import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { StoryScene } from '~/components/story/StoryController'
import { Screen } from '~/components/story/primitives/Screen'
import { BootStandby, ScrollHint } from '~/components/story/primitives/BootStandby'
import { BootSequence } from '~/components/story/scenes/lazy-stages'

export function Scene0Boot() {
  return (
    <StoryScene
      id="ch-power-on"
      code="00"
      kicker="Power on"
      headingLevel="h2"
      heading="Viewixsoft: The Operating System for Every Screen on Earth"
      answer="Viewixsoft is the digital signage software platform that directs, monetizes, and monitors commercial displays worldwide with zero downtime."
      length="short"
      poster={<BootPoster />}
      stage={(p) => <BootSequence progress={p} />}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 rounded-md bg-brand-gradient shine px-5 py-3 text-sm font-semibold text-on-gradient transition-colors hover:opacity-90"
        >
          Request demo
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 rounded-md border border-ink-700 px-5 py-3 text-sm font-semibold text-ink-50 transition-colors hover:border-ink-500"
        >
          Explore products
        </Link>
      </div>
    </StoryScene>
  )
}

/** SSR / pre-hydration frame: the screen in standby. Matches the stage at progress 0. */
function BootPoster() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <Screen className="aspect-video w-full max-h-full">
        <BootStandby />
      </Screen>
      <div className="relative h-4 w-full">
        <ScrollHint>Scroll to power on ↓</ScrollHint>
      </div>
    </div>
  )
}
