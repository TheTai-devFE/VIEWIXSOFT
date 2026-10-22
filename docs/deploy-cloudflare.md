# Deploy to Cloudflare Workers

The site runs as one Cloudflare Worker (SSR, server functions, sitemap, admin) with static assets served by Cloudflare. Data lives in Neon Postgres, images in Cloudflare R2, email goes through Resend.

You need: a Cloudflare account with `viewixsoft.com` added as a zone, a Neon project, and a Resend account.

## 1. Log in with Wrangler

```bash
pnpm wrangler login
pnpm wrangler whoami   # note your Account ID
```

## 2. Create the R2 bucket for images

1. Cloudflare dashboard → **R2 Object Storage** → **Create bucket** → name `viewixsoft-media` (must match `R2_BUCKET` in `wrangler.jsonc`).
2. Bucket → **Settings** → **Custom Domains** → **Connect Domain** → `media.viewixsoft.com`. This is the public URL for images (`R2_PUBLIC_URL`). For a quick test you can enable the `r2.dev` URL instead, but don't use it in production.
3. R2 overview → **Manage API tokens** → **Create API token** → permission **Object Read & Write**, limited to `viewixsoft-media`. Copy the **Access Key ID** and **Secret Access Key** (shown once). The **Account ID** is in the same screen.

## 3. Create the Turnstile widget

Dashboard → **Turnstile** → **Add widget** → hostname `viewixsoft.com` (add your `*.workers.dev` preview hostname too if you test there) → mode **Managed**. Copy the **site key** (public) and **secret key**.

For local testing Cloudflare provides test keys that always pass: site key `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`.

## 4. Set up email (Resend)

Resend → **Domains** → add `viewixsoft.com` and add the DNS records it shows in Cloudflare DNS. When verified, create an **API key** (sending access). `EMAIL_FROM` must use the verified domain, e.g. `Viewixsoft <hello@viewixsoft.com>`.

## 5. Prepare the production database

Use the Neon production branch's pooled connection string:

```bash
DATABASE_URL="postgresql://…" pnpm db:migrate
DATABASE_URL="postgresql://…" pnpm admin:create you@viewixsoft.com
```

## 6. Check the plain settings

`wrangler.jsonc` → `vars` holds non-secret settings: `SITE_URL`, `BETTER_AUTH_URL`, `EMAIL_FROM`, `SALES_NOTIFICATION_EMAIL`, `R2_BUCKET`, `R2_PUBLIC_URL`. Edit them if they differ, and commit.

## 7. Build-time public keys

Variables starting with `VITE_PUBLIC_` are baked into the browser bundle at build time, so they must exist when you build. Create `.env.production.local` (git-ignored):

```ini
VITE_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAA…
# Set to true only after step 11
VITE_PUBLIC_IMAGE_TRANSFORMS=
```

## 8. First deploy

```bash
pnpm cf:deploy
```

This runs the content checks, builds for Workers and deploys a Worker named `viewixsoft`. Wrangler prints a `*.workers.dev` URL.

## 9. Add the secrets

Run each command and paste the value when asked. Secrets are encrypted and never stored in the repo.

```bash
pnpm wrangler secret put DATABASE_URL --name viewixsoft
pnpm wrangler secret put BETTER_AUTH_SECRET --name viewixsoft     # openssl rand -base64 32
pnpm wrangler secret put IP_HASH_SALT --name viewixsoft           # openssl rand -base64 32
pnpm wrangler secret put TURNSTILE_SECRET_KEY --name viewixsoft
pnpm wrangler secret put RESEND_API_KEY --name viewixsoft
pnpm wrangler secret put R2_ACCOUNT_ID --name viewixsoft
pnpm wrangler secret put R2_ACCESS_KEY_ID --name viewixsoft
pnpm wrangler secret put R2_SECRET_ACCESS_KEY --name viewixsoft
```

Until `BETTER_AUTH_SECRET`, `IP_HASH_SALT` and `TURNSTILE_SECRET_KEY` are set, public pages work but the forms and admin sign-in refuse requests on purpose.

## 10. Connect the domain

Workers & Pages → `viewixsoft` → **Settings** → **Domains & Routes** → **Add** → **Custom domain** → `viewixsoft.com`. Add `www.viewixsoft.com` too, then a **Redirect Rule** (Rules → Redirect Rules) from `www.viewixsoft.com/*` to `https://viewixsoft.com/${1}` with status 301, so there is one canonical host.

## 11. Optional: image resizing

Dashboard → **Images** → **Transformations** → enable for `viewixsoft.com`. Then set `VITE_PUBLIC_IMAGE_TRANSFORMS=true` in `.env.production.local` and deploy again. Check the current free allowance and pricing on Cloudflare before enabling.

## 12. Verify

- `https://viewixsoft.com/robots.txt`, `/sitemap.xml`, `/llms.txt` load.
- Submit the contact form: the lead appears in `/admin/leads`, and both emails arrive.
- Sign in at `/admin`, change a section in **Site sections** and see it on the site within a minute.
- Upload an image in **Images** and see it served from `media.viewixsoft.com`.
- Workers & Pages → `viewixsoft` → **Logs** shows JSON logs without emails or names.
- Submit the sitemap in Google Search Console and Bing Webmaster Tools.

## Deploy from GitHub instead (optional)

Workers & Pages → `viewixsoft` → **Settings** → **Builds** → connect the GitHub repository. Build command `pnpm build`, deploy command `npx wrangler deploy`. Add `VITE_PUBLIC_TURNSTILE_SITE_KEY` (and `VITE_PUBLIC_IMAGE_TRANSFORMS`) under **Build variables**. Every push to `main` deploys; other branches get preview URLs.

## Local preview of the production Worker

Copy your settings to `.dev.vars` (git-ignored, same format as `.env`), then `pnpm cf:preview`. This runs the built Worker in `workerd`, the same runtime as production.
