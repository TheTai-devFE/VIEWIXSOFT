import { useState } from 'react'
import { SceneLink, StoryScene } from '~/components/story/StoryController'
import { ChannelSwitcher } from '~/components/story/ChannelSwitcher'
import { CMS_CHANNELS } from '~/components/story/story-content'
import type { CmsChannel } from '~/components/story/story-content'
import { ScreenWall, TimelineScrubber } from '~/components/story/scenes/lazy-stages'

export function Scene2Cms() {
  const [channel, setChannel] = useState<CmsChannel>(CMS_CHANNELS[0] as CmsChannel)

  return (
    <StoryScene
      id="ch-cms"
      code="02"
      kicker="Viewixsoft CMS"
      heading="How Do You Synchronize 1,000 Screens in Real Time?"
      answer="Viewixsoft CMS lets marketing teams schedule playlists, target dynamic content by location and hour, and push updates across thousands of displays instantly."
      stage={(p) => (
        <div className="flex h-full flex-col gap-3">
          <div className="min-h-0 flex-[3]">
            <ScreenWall progress={p} mode="sync" channel={channel} />
          </div>
          <div className="min-h-0 flex-[2]">
            <TimelineScrubber progress={p} />
          </div>
        </div>
      )}
    >
      <ChannelSwitcher label="Preview an industry" channels={CMS_CHANNELS} active={channel} onChange={setChannel} />
      <SceneLink to="/products/$slug" params={{ slug: 'cms' }}>
        Explore Viewixsoft CMS
      </SceneLink>
    </StoryScene>
  )
}
