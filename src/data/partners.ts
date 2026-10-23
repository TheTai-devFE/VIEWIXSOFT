/**
 * Default partners for the home page logo strip. Admins manage the real list
 * in /admin/pages → Home → Hero (logos come from the image library), which
 * replaces this one once saved.
 *
 * Add a partner only with written permission to show their logo. While the
 * list is empty the strip is hidden in production and shows labelled
 * placeholders in the dev server.
 */
export interface Partner {
  name: string
  logo: string
}

export const PARTNERS: Partner[] = []
