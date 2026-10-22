/**
 * Partner logos for the home page logo strip.
 *
 * Add a partner only with written permission to show their logo. Put the file
 * in `public/partners/` (SVG preferred, transparent background) and reference
 * it as `/partners/<file>`.
 *
 * TODO(content): add real partners. While the list is empty the strip is hidden
 * in production and shows labelled placeholders in the dev server.
 */
export interface Partner {
  name: string
  logo: string
}

export const PARTNERS: Partner[] = []
