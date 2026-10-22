import { SceneLink, StoryScene } from '~/components/story/StoryController'
import { WorldPulseMap } from '~/components/story/scenes/lazy-stages'

export function Scene5Tracking() {
  return (
    <StoryScene
      id="ch-tracking"
      code="05"
      kicker="Viewixsoft Tracking"
      heading="How Do Advertisers Verify That Ads Actually Played?"
      answer="Viewixsoft Tracking generates tamper-evident proof-of-play certificates and real-time screen telemetry, giving network operators and advertisers indisputable broadcast auditing."
      stage={(p) => <WorldPulseMap progress={p} />}
    >
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-ink-800 bg-ink-800 font-mono text-xs">
        <div className="bg-ink-950 p-3">
          <dt className="text-ink-500">Per play</dt>
          <dd className="mt-1 text-ink-50">Frame-render hash</dd>
        </div>
        <div className="bg-ink-950 p-3">
          <dt className="text-ink-500">Per screen</dt>
          <dd className="mt-1 text-ink-50">Health heartbeat</dd>
        </div>
      </dl>
      <SceneLink to="/products/$slug" params={{ slug: 'tracking' }}>
        Explore Viewixsoft Tracking
      </SceneLink>
    </StoryScene>
  )
}
