import { useState } from 'react'
import { SceneLink, StoryScene } from '~/components/story/StoryController'
import { ChannelSwitcher } from '~/components/story/ChannelSwitcher'
import { NFC_CHANNELS } from '~/components/story/story-content'
import type { NfcChannel } from '~/components/story/story-content'
import { NfcPhoneRipple } from '~/components/story/scenes/lazy-stages'

export function Scene4Nfc() {
  const [channel, setChannel] = useState<NfcChannel>(NFC_CHANNELS[0] as NfcChannel)

  return (
    <StoryScene
      id="ch-nfc"
      code="04"
      kicker="Viewixsoft NFC"
      heading="Can Customers Interact with Signage Without Downloading an App?"
      answer="Viewixsoft NFC turns passive billboard and kiosk screens into two-way engagement points, delivering instant mobile coupons, loyalty points, and product checkouts with a physical tap."
      stage={(p) => <NfcPhoneRipple progress={p} channel={channel} />}
    >
      <ChannelSwitcher label="Preview a tap" channels={NFC_CHANNELS} active={channel} onChange={setChannel} />
      <SceneLink to="/products/$slug" params={{ slug: 'nfc' }}>
        Explore Viewixsoft NFC
      </SceneLink>
    </StoryScene>
  )
}
