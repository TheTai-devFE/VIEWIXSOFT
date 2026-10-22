import { useState } from 'react'
import { SceneLink, StoryScene } from '~/components/story/StoryController'
import { ChannelSwitcher } from '~/components/story/ChannelSwitcher'
import { POS_CHANNELS } from '~/components/story/story-content'
import type { PosChannel } from '~/components/story/story-content'
import { ReceiptToMenu } from '~/components/story/scenes/lazy-stages'

export function Scene3Pos() {
  const [channel, setChannel] = useState<PosChannel>(POS_CHANNELS[0] as PosChannel)

  return (
    <StoryScene
      id="ch-pos"
      code="03"
      kicker="Viewixsoft POS"
      heading="How Do Digital Menu Boards Stay in Sync with Cash Registers?"
      answer="Viewixsoft POS binds point-of-sale registers directly to digital menu boards, updating prices, lunch combos, and sold-out items within 250 milliseconds."
      stage={(p) => <ReceiptToMenu progress={p} channel={channel} />}
    >
      <ChannelSwitcher label="Preview a venue" channels={POS_CHANNELS} active={channel} onChange={setChannel} />
      <SceneLink to="/products/$slug" params={{ slug: 'pos' }}>
        Explore Viewixsoft POS
      </SceneLink>
    </StoryScene>
  )
}
