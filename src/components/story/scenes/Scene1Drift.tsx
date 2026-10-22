import { SceneLink, StoryScene } from '~/components/story/StoryController'
import { ScreenWall } from '~/components/story/scenes/lazy-stages'

export function Scene1Drift() {
  return (
    <StoryScene
      id="ch-drift"
      code="01"
      kicker="The problem"
      heading="What Happens When 1 Screen Becomes 100?"
      answer="Without central orchestration, scaling a digital screen network leads to content drift, mismatched pricing, manual USB stick chaos, and silent display failures."
      stage={(p) => <ScreenWall progress={p} mode="multiply" />}
    >
      <ul className="space-y-1.5 font-mono text-xs text-ink-400">
        <li><span className="text-alert">×</span> Holiday ads still running in July</li>
        <li><span className="text-alert">×</span> Breakfast menu at 3 PM</li>
        <li><span className="text-alert">×</span> Dead screens nobody reports</li>
      </ul>
      <SceneLink to="/products/$slug" params={{ slug: 'cms' }}>
        Explore Viewixsoft CMS
      </SceneLink>
    </StoryScene>
  )
}
