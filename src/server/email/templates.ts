import type { LeadInput } from '~/server/schema/validation'

/*
 * Plain HTML emails with inline styles: they render in every client and need
 * no build step. Every user-supplied value goes through `esc`.
 */

function esc(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function layout(title: string, body: string) {
  return `<!doctype html><html lang="en"><body style="margin:0;background:#f6f6f9;font-family:Arial,Helvetica,sans-serif;color:#18181b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;padding:32px">
<tr><td><p style="margin:0 0 24px;font-weight:bold;font-size:18px">Viewixsoft</p>
<h1 style="margin:0 0 16px;font-size:20px">${esc(title)}</h1>${body}</td></tr></table>
<p style="font-size:12px;color:#71717a;margin-top:16px">Viewixsoft · digital signage software</p>
</td></tr></table></body></html>`
}

const row = (label: string, value: string | undefined) =>
  value ? `<tr><td style="padding:4px 12px 4px 0;color:#71717a;vertical-align:top">${esc(label)}</td><td style="padding:4px 0">${esc(value)}</td></tr>` : ''

export function salesNotificationEmail(lead: LeadInput, meta: { adminUrl: string }) {
  const kind = lead.type === 'demo' ? 'Demo request' : 'Contact request'
  const subject = `${kind}: ${lead.company} (${lead.country})`
  const html = layout(
    subject,
    `<table role="presentation" style="font-size:14px;line-height:1.5">
${row('Name', lead.name)}${row('Email', lead.email)}${row('Company', lead.company)}${row('Job title', lead.jobTitle)}
${row('Country', lead.country)}${row('Phone', lead.phone)}${row('Company size', lead.companySize)}
${row('Screens', lead.screenCount)}${row('Products', lead.products.join(', '))}${row('Source', lead.utmSource)}
</table>
<p style="font-size:14px;line-height:1.6;white-space:pre-wrap;border-left:3px solid #7c3aed;padding-left:12px">${esc(lead.message)}</p>
<p><a href="${esc(meta.adminUrl)}" style="color:#7c3aed">Open in the lead dashboard</a></p>`,
  )
  const text = `${subject}\n\nName: ${lead.name}\nEmail: ${lead.email}\nCompany: ${lead.company}\nCountry: ${lead.country}\nScreens: ${lead.screenCount ?? '-'}\nProducts: ${lead.products.join(', ')}\n\n${lead.message}\n\n${meta.adminUrl}`
  return { subject, html, text }
}

export function leadConfirmationEmail(lead: LeadInput) {
  const subject = 'We received your request'
  const html = layout(
    `Thanks, ${lead.name.split(' ')[0] ?? lead.name}`,
    `<p style="font-size:14px;line-height:1.6">We received your request about ${esc(lead.company)}'s screens. The Viewixsoft team will email you to set up a time and show Viewixsoft CMS on a setup like yours.</p>
<p style="font-size:14px;line-height:1.6">If you need to add anything, just reply to this email.</p>`,
  )
  const text = `Thanks for contacting Viewixsoft.\n\nWe received your request about ${lead.company}'s screens. The Viewixsoft team will email you to set up a time and show Viewixsoft CMS on a setup like yours.\n\nIf you need to add anything, just reply to this email.`
  return { subject, html, text }
}

/** `productNames` are the launches asked for; `newsletter` is whether the general list was picked too. */
export function newsletterConfirmEmail(confirmUrl: string, { newsletter, productNames }: { newsletter: boolean; productNames: string[] }) {
  const launches = productNames.length > 0 ? `launch news for ${productNames.join(', ')}` : ''
  const what = [newsletter ? 'the Viewixsoft newsletter' : '', launches].filter(Boolean).join(' and ') || 'the Viewixsoft newsletter'
  const subject = `Confirm your sign-up for ${what}`
  const html = layout(
    'Please confirm your email',
    `<p style="font-size:14px;line-height:1.6">You asked to get ${esc(what)}. Confirm your email address to start receiving it.</p>
<p><a href="${esc(confirmUrl)}" style="display:inline-block;background:#7c3aed;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Confirm my email</a></p>
<p style="font-size:12px;color:#71717a">If you did not sign up, ignore this email and nothing will be sent.</p>`,
  )
  const text = `You asked to get ${what}. Confirm your email address: ${confirmUrl}\n\nIf you did not sign up, ignore this email.`
  return { subject, html, text }
}
