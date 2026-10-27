# Deploy to Vercel

The site runs as one Vercel Function (SSR, server functions, sitemap, admin) in region `sin1`, next to the Neon database. Static assets go through Vercel's CDN. Data stays in Neon Postgres, media in Cloudflare R2, email goes through Resend. DNS stays at the current registrar.

`vite.config.ts` builds for Vercel when `VERCEL=1` (Vercel sets it during builds) and for Cloudflare Workers otherwise, so [deploy-cloudflare.md](deploy-cloudflare.md) still works.

Plan: Vercel Hobby is for non-commercial use only. A company marketing site needs Pro.

## 1. Push the repository to GitHub

Vercel deploys from Git. Push the branch you want to deploy (normally `main`).

## 2. Import the project

Vercel → **Add New… → Project** → import the repository. Vercel detects pnpm from `pnpm-lock.yaml`. Keep the defaults:

- Framework preset: **Other** (Nitro writes `.vercel/output` itself)
- Build command: `pnpm build`
- Output directory: leave empty

Don't deploy yet: add the environment variables first.

## 3. Environment variables

Project → **Settings → Environment Variables**, scope **Production** (and **Preview** if preview deploys should work). `VITE_PUBLIC_*` values are baked in at build time, so redeploy after changing them.

| Name | Value |
|---|---|
| `SITE_URL` | `https://<project>.vercel.app` until the domain moves, then `https://viewixsoft.com`. Used for links in emails. |
| `BETTER_AUTH_URL` | Same as `SITE_URL` |
| `DATABASE_URL` | Neon pooled connection string |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `IP_HASH_SALT` | `openssl rand -base64 32` (reuse the existing one to keep rate-limit history) |
| `VITE_PUBLIC_TURNSTILE_SITE_KEY` | Turnstile site key |
| `TURNSTILE_SECRET_KEY` | Turnstile secret key |
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | `Viewixsoft <hello@viewixsoft.com>` |
| `SALES_NOTIFICATION_EMAIL` | Inbox that receives leads |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | From the R2 API token |
| `R2_PUBLIC_URL` | Public URL of the bucket, no trailing slash |
| `VITE_PUBLIC_SHOW_PLACEHOLDER_QUOTES` | Optional. `true` shows lorem ipsum customer quotes on /about until real ones are approved. Remove it before the site goes live on `viewixsoft.com`. |

Do not set `NODE_ENV`: Vercel sets it, and a value here breaks the build. Leave `VITE_PUBLIC_IMAGE_TRANSFORMS` unset; image transformations are a Cloudflare zone feature.

## 4. Deploy

Click **Deploy**. Every push to `main` deploys to production; other branches get preview URLs.

## 5. Allow the new hostname in other services

- **Turnstile:** add `<project>.vercel.app` (and later `viewixsoft.com`) to the widget's hostnames, or the forms fail verification.
- **R2 CORS:** add `https://<project>.vercel.app` to `AllowedOrigins`, or video uploads from the admin fail.

## 6. Database and admin

Migrations run from your machine, not during the build:

```bash
DATABASE_URL="postgresql://…" pnpm db:migrate
DATABASE_URL="postgresql://…" pnpm admin:create you@viewixsoft.com   # only if the account doesn't exist yet
```

## 7. Custom domain (when ready)

Project → **Settings → Domains** → add `viewixsoft.com` and `www.viewixsoft.com` (redirect `www` to the apex). Vercel shows the DNS records to create at the registrar, usually:

| Host | Type | Value |
|---|---|---|
| `@` | A | `76.76.21.21` |
| `www` | CNAME | `cname.vercel-dns.com` |

Use the exact values Vercel shows. Replace only the existing `@` and `www` records; leave the others (mail, subdomains) alone. Then set `SITE_URL` and `BETTER_AUTH_URL` to `https://viewixsoft.com` and redeploy.

## 8. Verify

- `/robots.txt`, `/sitemap.xml`, `/llms.txt` load.
- Submit the contact form: the lead appears in `/admin/leads` and both emails arrive.
- Sign in at `/admin` and upload an image.
- Project → **Logs** shows JSON logs without emails or names.
