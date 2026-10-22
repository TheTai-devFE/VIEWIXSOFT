import { LazyMotion, domAnimation, useMotionValue, useScroll } from 'motion/react'
import type { RefObject } from 'react'
import type { StageRenderer } from '~/components/story/StoryController'

export type StageFrame = 'live' | 'before' | 'after'

interface ScrollStageProps {
  trackRef: RefObject<HTMLDivElement | null>
  stage: StageRenderer
  frame: StageFrame
}

/**
 * Client-only bridge between the page scroll and a stage. Lives in its own
 * chunk with `motion`, so no animation code sits on the critical path.
 * `before` / `after` freeze the stage for the reduced-motion layout.
 */
export function ScrollStage({ trackRef, stage, frame }: ScrollStageProps) {
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] })
  const before = useMotionValue(0.08)
  const after = useMotionValue(1)
  const progress = frame === 'live' ? scrollYProgress : frame === 'before' ? before : after

  return (
    <LazyMotion features={domAnimation} strict>
      {stage(progress)}
    </LazyMotion>
  )
}
