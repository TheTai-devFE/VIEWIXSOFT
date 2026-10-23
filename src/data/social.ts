/**
 * Official Viewixsoft social profiles, shown as icons in the footer and
 * published as `sameAs` in the Organization JSON-LD.
 *
 * TODO(content): add each profile's URL once the account exists. A profile
 * with no URL is hidden on the live site (the dev server shows a faded
 * stand-in), because a link to a missing profile weakens the brand entity.
 */
export type SocialNetwork = 'facebook' | 'tiktok' | 'linkedin' | 'x'

export const SOCIAL_LINKS: { network: SocialNetwork; label: string; url: string }[] = [
  { network: 'facebook', label: 'Facebook', url: '' },
  { network: 'tiktok', label: 'TikTok', url: '' },
  { network: 'linkedin', label: 'LinkedIn', url: '' },
  { network: 'x', label: 'X', url: '' },
]
