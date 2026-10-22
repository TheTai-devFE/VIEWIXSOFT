# Blog writing guide

How to write and publish a Viewixsoft blog post that ranks in search and gets quoted by AI assistants. Read with [AGENTS.md](../AGENTS.md) §9 and the marketing, SEO and GEO playbooks in `.claude/skills/`.

## Publish a post in 5 steps

1. Copy [blog-template.mdx](blog-template.mdx) to `src/content/blog/<slug>.mdx`. The file name is the URL: `src/content/blog/schedule-content-multiple-screens.mdx` → `/blog/schedule-content-multiple-screens`. Use lowercase words and hyphens; never rename a published post (it breaks links) without adding a 301 redirect (AGENTS.md §8; ask before changing URLs).
2. Fill in the frontmatter (table below) and write the body in Markdown.
3. Run `pnpm dev` and open the post. Drafts (`draft: true`) show only in the dev server, with a "Draft" badge.
4. Run `pnpm content:check`. It fails on any invalid frontmatter, a title that is too long or a duplicate.
5. Set `draft: false`, commit and deploy. The post then appears on `/blog`, in `sitemap.xml`, `rss.xml`, `llms.txt`, `llms-full.txt` and at `/blog/<slug>.md`.

## Frontmatter

| Field | Rule |
| --- | --- |
| `title` | The H1. Clear and specific, 10–120 characters. Question or "How to…" titles work well. |
| `seoTitle` | The browser and Google title, **at most 47 characters** (the site adds " — Viewixsoft"). Put the main keyword first. |
| `description` | 50–155 characters. One sentence that answers "what will I learn?". Shown in Google results. |
| `product` | `cms`, `pos`, `tracking` or `nfc`. Used for the blog filter and related posts. |
| `category`, `tags` | Short labels. 1–8 tags. |
| `publishedAt`, `updatedAt` | `"YYYY-MM-DD"` in quotes. Bump `updatedAt` whenever you change facts; Google and AI tools favour fresh, dated content. |
| `author` | A key from `src/data/authors.ts`. Add real people there (with their approval) to build expertise signals. |
| `cover` | Image path under `public/` and alt text describing the image. 16:9, WebP. |
| `keyTakeaways` | 2–5 one-sentence takeaways, shown in a box at the top. AI answers often quote these. |
| `faq` | Optional, up to 8. Generates `FAQPage` structured data. Use questions people really ask. |
| `draft` | `true` until the post is reviewed. |

Reading time and the table of contents are generated from the body at build time.

## Write for search and AI answers

- **Answer first.** The first paragraph answers the title in 1–2 sentences that make sense on their own. Every H2 section does the same.
- **Question-style H2s** that match real searches: "How much does it cost to run 100 screens?", "What is proof-of-play?". Use H3 under them; never skip levels. Don't add an H1 in the body (the title is the H1).
- **Concrete over vague.** Numbered steps, comparison tables, definitions and specific numbers get quoted. Avoid hype words ("revolutionary", "best-in-class").
- **Every statistic needs a source and a date**, linked in the text: "Digital signage spend grew X% in 2025 ([Source name](https://…), 2026)". No source, no statistic. Never invent customer results.
- **Product names** are always written in full: Viewixsoft CMS, Viewixsoft POS, Viewixsoft Tracking, Viewixsoft NFC. Say plainly when a product is coming soon.
- **Link internally** with descriptive text: to the product page (`/products/cms`), a related use case (`/use-cases/qsr-menu-boards`) and one or two related posts. End with a next step (`/contact` or `/pricing`).
- **Plain US English**, short sentences, active voice. 1,000–2,000 words is a good range for a guide.

MDX notes: `{` and `<` have special meaning in MDX. Write `\{` for a literal brace and `&lt;` for a literal less-than sign. Tables, lists, bold, links and images use normal Markdown.

## Which topics to write first

Start where Viewixsoft CMS can actually help today, and target questions buyers ask before they choose software. Check real search demand in Google Search Console, Google Keyword Planner or a similar tool before writing; the list below is a starting point, not measured data.

| Topic cluster | Example posts |
| --- | --- |
| Digital signage basics | What is digital signage software? · Digital signage CMS vs USB sticks · What hardware do you need for digital signage? |
| Content scheduling | How to schedule content on multiple screens · Dayparting for menu boards · How to update screens in many locations at once |
| Menu boards (restaurants) | How to set up digital menu boards · Portrait vs landscape menu screens · How often should menu boards change? |
| Retail | Digital signage ideas for retail stores · How to run in-store promotions on screens |
| Costs | How much does digital signage software cost? (link to /pricing) · Cloud vs self-hosted signage software |
| Reliability | What happens when a signage screen loses internet? · How to keep screens running 24/7 |

Publish steadily (for example one guide every week or two) rather than many at once, and update older posts when facts change.

## Checklist before `draft: false`

- [ ] Title answers a real question; `seoTitle` starts with the main keyword.
- [ ] First paragraph answers the title on its own.
- [ ] H2s are questions or clear statements; no H1 in the body.
- [ ] Every number has a linked source and a date; no invented results or quotes.
- [ ] Product names written in full; unreleased products marked as coming soon.
- [ ] 3+ internal links, ending with a next step.
- [ ] Cover image has meaningful alt text.
- [ ] `pnpm content:check` passes.
