# Viewixsoft — Design System

> Generated from `src/styles/tokens.css`, `src/styles/app.css` and `src/components/ui` (main@b102068, 2026-10-30). The code is the source of truth; regenerate this file after changing it.

## Contents

1. [Content fundamentals](#content-fundamentals)
2. [Visual foundations](#visual-foundations)
3. [Iconography](#iconography)
4. [Logos](#logos)
5. [Color tokens](#color-tokens)
6. [Typography](#typography)
7. [Spacing](#spacing)
8. [Radius](#radius)
9. [Motion](#motion)
10. [Components](#components)
11. [Not synced](#not-synced)

Viewixsoft makes digital signage software: Viewixsoft CMS, Viewixsoft POS, Viewixsoft Tracking and Viewixsoft NFC. Viewixsoft is the software arm of Viewix, which sells the screen hardware. The website is for a global B2B audience. It is light-first, precise and calm, and it tells its story through dark "screens" that glow, like real displays in a bright room.

This system mirrors the code in `TheTai-devFE/VIEWIXSOFT` (main@b102068): `src/styles/tokens.css`, `src/styles/app.css` and `src/components/ui`. The code is the source of truth. Change the code first, then re-sync this system.

## Content fundamentals

- **Product names in full, every time:** Viewixsoft CMS, Viewixsoft POS, Viewixsoft Tracking, Viewixsoft NFC. The brand is one word with a capital V: **Viewixsoft**. Never "Viewix" (that is the hardware parent), "VX CMS" or lowercase.
- **Answer first.** Every page and every H2 opens with a direct 1–2 sentence answer that can be quoted on its own, then the details.
- **Question-style H2s** that match real searches: "What is digital signage software?", "How much does it cost to run 100 screens?"
- US English, plain words, active voice, short sentences. No hype ("revolutionary", "best-in-class") unless a fact backs it up.
- Every statistic has a source and a date. If there is no source, leave the statistic out.
- CTAs: the primary is "Book a demo", the secondary is "Explore products". Buttons start with a verb and use sentence case.
- Exception: the `/admin` UI copy is in Vietnamese. Everything public is in English.

## Visual foundations

**Light room, dark screens.** The page is white (`surface-room`) with cool neutrals. Story visuals sit in `.screen-dark` frames that keep the dark values in both themes, so a screen always reads as a lit display. Dark mode is used only by the admin.

**Mirrored scales.** `color-ink-*` and `color-signal-*` are written from the dark room's point of view: `ink-950` is the room and `ink-50` is the text. The light theme mirrors both scales, so `bg-ink-950 text-ink-50` means "room surface, primary text" in either theme. `signal-400` is always the strong accent.

**Colour roles.**
- Text: `fg` on `surface-room` / `surface-panel`. Secondary text uses `fg-muted` (`color-ink-400`). Both pass 4.5:1 in both themes.
- Accent: `signal` (violet) for links, focus rings, active states and the eyebrow. Text on a solid signal fill uses `on-signal`.
- Brand gradient: `color-gradient-from → via → to` (indigo → violet → fuchsia). Use it only for the primary CTA fill and for one highlighted phrase per heading (`text-brand-gradient`). White `color-on-gradient` passes AA on every stop.
- `color-brand` (#0052cc) is the logo blue, **for the logo only**. It is 2.6:1 on the dark room, too low for text.
- Product glows (`color-light-cms`, `-pos`, `-nfc`, `-tracking`) appear **only inside a dark screen**, never on page chrome.
- `color-stage` is a light catalogue stage for hardware photos in both themes. Its text is `color-stage-ink`.
- `color-alert` is for errors and destructive actions. `color-success` and `color-warning` are for status icons and badges.

**Shape.** Corners are crisp and hardware-like: `radius-md` (4px) for controls, `radius-2xl` (10px) for cards, `radius-3xl` (12px) for the largest tiles. Surfaces are solid `panel`s with a 1px `line` border. There is no glass, no glow and no drop shadow; depth comes from surface steps (`ink-950 → 900 → 850`).

**Type.** Manrope for display and body (variable 400–800, self-hosted latin subset). JetBrains Mono for the eyebrow "broadcast labels" (`CH 02 · CMS`) and for specs. Headings are semibold with tight tracking. `hero` and `scene` are fluid with `clamp()`. Use one `<h1>` per page and never skip a heading level.

**Layout.** Content runs full width inside `page-x`: a fluid gutter, `clamp(1rem, 4vw, 6rem)`, and `container-max` of 1600px. Every section gets `section-y`, which is `space-16` on mobile and `space-20` from lg up. Running text stays at about 65–75 characters per line. The layout is mobile-first and is checked at 360, 768, 1280 and 1920px.

**Broadcast details.** Small motifs from screens: safe-area corner marks (`safe-marks`), CRT `scanlines` and a `hatch` divider (inside screens only), and a blinking LED. Use them sparingly, as texture and not as decoration.

**Motion.** Animate `transform` and `opacity` only, with `ease-broadcast`, over `duration-fast`, `-base` or `-slow`. Every animation respects `prefers-reduced-motion`. Content is never hidden behind an animation.

**Accessibility.** WCAG 2.2 AA. The focus ring is 2px `signal` with a 2px offset. There is a skip link to `#main`. Every field has a label. Icon-only buttons have an `aria-label`.

## Iconography

Icons come from **lucide-react**: 24px grid, 2px stroke, `currentColor`, usually shown at 16px (`size-4`) inside buttons. Put icons inline next to text. **Don't place icons inside rounded, gradient or filled square tiles**; that pattern looks generic. Larger illustrations are custom isometric SVG scenes that use the token colours.

## Logos

Generated from the paths in `src/components/blocks/ViewixLogo.tsx`, which come from the official logo file. They are not redrawn.

- `viewixsoft-wordmark.svg`: the full lockup (mark + VIEWIX + SOFT) in `color-brand` #0052cc. Use it on light grounds.
- `viewixsoft-wordmark-white.svg`: the same lockup in white. Use it on dark grounds and inside screens.
- `viewixsoft-mark.svg`: the diamond mark alone in `color-brand`. Use it for small spaces.
- `viewixsoft-app-icon.svg`: the favicon / app icon, a white mark on a #0052cc rounded square (`public/favicon.svg`).
- `viewixsoft-logo.png`: the raster logo from `public/logo.png` (for email and link previews).

In code, `<ViewixLogo tone="mono">` uses `currentColor`, so the logo takes the colour of its text; `tone="brand"` uses `color-brand`. Always give the logo the accessible name "Viewixsoft".


## Color tokens

CSS custom property = `--<name>`. Light is the default theme (`:root`); dark applies under `.dark` and inside every `.screen-dark` frame.

### Ink (neutral scale)

Written from the dark room point of view: `ink-950` = room surface, `ink-50` = primary text. The light theme mirrors the scale.

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--color-ink-950` | `#ffffff` | `#070809` | Room surface: the page background (white in light, near-black in dark). |
| `--color-ink-900` | `#f8f8fc` | `#0c0e10` | Panel surface one step off the room; cards and raised panels. |
| `--color-ink-850` | `#f2f2f8` | `#111315` | Bezel / nested panel surface. |
| `--color-ink-800` | `#e7e7f0` | `#1a1d20` | Hairline borders and dividers (the `line` role). |
| `--color-ink-700` | `#d6d6e2` | `#2a2e32` | Stronger borders, hover outlines on neutral controls. |
| `--color-ink-600` | `#b3b3c4` | `#42474c` | Disabled fills and decorative strokes; not for text. |
| `--color-ink-500` | `#67677c` | `#7a8187` | Placeholder text and tertiary labels (light 5.6:1 on ink-950). |
| `--color-ink-400` | `#545468` | `#959b9f` | Muted body text and descriptions (the `fg-muted` role). |
| `--color-ink-300` | `#3d3d50` | `#b5b8b6` | Secondary text on panels. |
| `--color-ink-200` | `#2a2a3b` | `#d6d4cc` | Strong secondary text. |
| `--color-ink-100` | `#1b1b29` | `#eae8e1` | Near-primary text; also the dark bezel around a screen in light theme. |
| `--color-ink-50` | `#0e0e1a` | `#f5f4ef` | Primary text on ink-950 / ink-900. |

### Signal (violet accent)

Mirrored in light so `signal-400` is always the strong accent.

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--color-signal-50` | `#2e1065` | `#f5f3ff` | Lightest tint (mirrored: deepest violet in light). |
| `--color-signal-100` | `#4c1d95` | `#ede9fe` | Tint for selected rows and soft badges. |
| `--color-signal-200` | `#5b21b6` | `#ddd6fe` | Soft fill. |
| `--color-signal-300` | `#6d28d9` | `#c4b5fd` | Signal text in light theme (#6d28d9, 7:1 on white). |
| `--color-signal-400` | `#7c3aed` | `#a78bfa` | THE strong accent: links, active states, selection colour. Darker on white, lighter on black. |
| `--color-signal-500` | `#8b5cf6` | `#8b5cf6` | Mid violet; charts and illustration. |
| `--color-signal-600` | `#a78bfa` | `#7c3aed` | Pressed / emphasised accent fills. |
| `--color-signal-700` | `#c4b5fd` | `#6d28d9` | Card hover border (panel-card). |
| `--color-signal-800` | `#ddd6fe` | `#5b21b6` | Subtle accent borders. |
| `--color-signal-900` | `#ede9fe` | `#4c1d95` | Accent wash behind content. |
| `--color-signal-950` | `#f5f3ff` | `#2e1065` | Deepest wash; result-card gradient base. |

### Semantic roles

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--surface-room` | `#ffffff` | `#070809` | Page background (`bg-background`). |
| `--surface-panel` | `#f8f8fc` | `#0c0e10` | Cards, popovers, inputs on hover (`bg-card`, `panel` utility). |
| `--surface-bezel` | `#1b1b29` | `#111315` | The frame around a product screen. |
| `--line` | `#e7e7f0` | `#1a1d20` | 1px borders and dividers (`border-border`, `border-input`). |
| `--fg` | `#0e0e1a` | `#f5f4ef` | Primary text on surface-room and surface-panel. |
| `--fg-muted` | `#545468` | `#959b9f` | Secondary text, descriptions, captions on surface-room/panel (7:1 light, 7:1 dark). |
| `--signal` | `#6d28d9` | `#a78bfa` | Primary accent: links, focus ring, active tab, `text-primary`. |
| `--on-signal` | `#ffffff` | `#070809` | Text on a solid signal fill. |
| `--color-success` | `#15803d` | `#22c55e` | Success icons and badges (3:1+ on both room surfaces). |
| `--color-warning` | `#b45309` | `#f59e0b` | Warning icons and badges. |

### Fixed brand and product colors

Same value in both themes.

| Token | Value | Usage |
|---|---|---|
| `--color-brand` | `#0052cc` | Official logo blue. Logo only: 2.6:1 on the dark room, too low for text. |
| `--color-gradient-from` | `#4f46e5` | Brand gradient start (indigo). Primary CTA fill, gradient text. |
| `--color-gradient-via` | `#7c3aed` | Brand gradient middle (violet). |
| `--color-gradient-to` | `#c026d3` | Brand gradient end (fuchsia). |
| `--color-on-gradient` | `#ffffff` | Text on the brand gradient; passes AA on every stop. |
| `--color-alert` | `#ff5a4f` | Destructive actions and errors (`destructive`). |
| `--color-light-cms` | `#8fd3ff` | Viewixsoft CMS glow — only inside a dark screen. |
| `--color-light-pos` | `#fbbf24` | Viewixsoft POS glow — only inside a dark screen. |
| `--color-light-nfc` | `#b49cff` | Viewixsoft NFC glow — only inside a dark screen. |
| `--color-light-tracking` | `#4ade80` | Viewixsoft Tracking glow — only inside a dark screen. |
| `--color-stage` | `#f1f1f6` | Product photo stage; stays light in both themes so hardware photos (mix-blend-multiply) blend in. |
| `--color-stage-glow` | `#ffffff` | Highlight on the photo stage. |
| `--color-stage-shadow` | `rgba(20, 20, 40, 0.2)` | Floor shadow under products on the stage. |
| `--color-stage-ink` | `#55556a` | Text on color-stage (4.5:1). |
| `--color-stage-line` | `#d4d4e0` | Hairlines on color-stage. |

### shadcn/ui aliases

| Token | Maps to |
|---|---|
| `--color-background` | `--surface-room` |
| `--color-foreground` | `--fg` |
| `--color-card` | `--surface-panel` |
| `--color-card-foreground` | `--fg` |
| `--color-primary` | `--signal` |
| `--color-primary-foreground` | `--on-signal` |
| `--color-muted` | `--surface-panel` |
| `--color-muted-foreground` | `--fg-muted` |
| `--color-destructive` | `--color-alert` |
| `--color-border` | `--line` |
| `--color-input` | `--line` |
| `--color-ring` | `--signal` |

## Typography

| Family | Stack | File |
|---|---|---|
| `--font-sans` | Manrope, ui-sans-serif, system-ui, sans-serif | `public/fonts/manrope-latin.woff2` (400 800) |
| `--font-display` | Manrope, ui-sans-serif, system-ui, sans-serif | `public/fonts/manrope-latin.woff2` (400 800) |
| `--font-mono` | "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace | `public/fonts/jetbrains-mono-latin.woff2` (400 600) |

Fonts are self-hosted latin subsets with `font-display: swap`; `__root.tsx` preloads Manrope.

### Display (`display`)

| Style | Size | Line height | Weight | Tracking | Sample | Usage |
|---|---|---|---|---|---|---|
| `hero` | 68px | 0.95 | 600 | -0.025em | Run every screen from one place | Page H1. Fluid: clamp(2.25rem, 3.4vw + 0.9rem, 4.25rem); shown at its max. |
| `scene` | 56px | 1.02 | 600 | -0.025em | What is digital signage software? | Large story headings. Fluid: clamp(1.875rem, 3.2vw + 0.75rem, 3.5rem); shown at its max. |
| `section-title` | 36px | 40px | 600 | -0.025em | How does Viewixsoft CMS work? | Section H2 (SectionHeading): text-3xl → sm:text-4xl, tracking-tight. |
| `card-title` | 20px | 28px | 600 | — | Viewixsoft Tracking | H3 in product and use-case cards. |

### Text (`sans`)

| Style | Size | Line height | Weight | Tracking | Sample | Usage |
|---|---|---|---|---|---|---|
| `body-lg` | 18px | 28px | 400 | — | Upload media, build playlists and schedule them by time and location. | Hero and section intros. |
| `body` | 16px | 24px | 400 | — | Manage every screen remotely from one cloud console. | Default running text; max width ~65–75 characters. |
| `ui` | 14px | 20px | 500 | — | Book a demo | Buttons, inputs, nav links, card text (text-sm). |
| `caption` | 12px | 16px | 400 | — | Updated Oct 2026 | Card descriptions in admin, footnotes, meta (text-xs). |

### Mono (`mono`)

| Style | Size | Line height | Weight | Tracking | Sample | Usage |
|---|---|---|---|---|---|---|
| `eyebrow` | 11px | 16px | 400 | 0.14em | CH 02 · CMS | The broadcast label above a heading: uppercase, colour `signal` (the `eyebrow` utility). |
| `code` | 13px | 20px | 400 | — | proof_of_play.csv | Specs, file names, device IDs. |

## Spacing

| Token | Value | Usage |
|---|---|---|
| `space-1` | `4px` | Base step (Tailwind 4px scale). Icon-to-text nudge. |
| `space-2` | `8px` | Gap inside buttons (gap-2), tight stacks. |
| `space-3` | `12px` | Gap between a checkbox and its label; eyebrow → heading. |
| `space-4` | `16px` | Button horizontal padding; heading → intro; mobile page gutter (min of page-gutter). |
| `space-5` | `20px` | Card padding (px-5 / py-5). |
| `space-6` | `24px` | Grid gaps between cards. |
| `space-8` | `32px` | Space between groups inside a section. |
| `space-16` | `64px` | section-y on mobile: padding above and below every section. |
| `space-20` | `80px` | section-y from lg up. |
| `page-gutter-max` | `96px` | Max side gutter (page-x). Fluid: clamp(1rem, 4vw, 6rem). |
| `container-max` | `1600px` | Max content width on wide screens (100rem, page-x). |

Tailwind 4px scale: `space-N` = `N × 4px` (`p-4` = 16px). Layout utilities: `page-x` (full width, fluid gutter `clamp(1rem, 4vw, 6rem)`, max `100rem`), `section-y` (`py-16 lg:py-20`).

## Radius

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | `2px` | Crisp, hardware-like corners: tiny chips. |
| `radius-md` | `4px` | Buttons, inputs, checkboxes. |
| `radius-lg` | `6px` | Small panels, menus. |
| `radius-xl` | `8px` | Media frames, screens. |
| `radius-2xl` | `10px` | Cards (Card). |
| `radius-3xl` | `12px` | Largest surfaces: bento tiles, CTA bands. |

These override the Tailwind defaults site-wide: corners stay crisp and hardware-like.

## Motion

Motion: animate transform and opacity only; honour prefers-reduced-motion. Easing for all of them: ease-broadcast cubic-bezier(0.22, 1, 0.36, 1).

| Token | Value | Usage |
|---|---|---|
| `--duration-fast` | `150ms` | Hover colour changes. |
| `--duration-base` | `250ms` | Card lift, menu open (with ease-broadcast). |
| `--duration-slow` | `600ms` | Reveal on scroll, menu items. |
| `--ease-broadcast` | `cubic-bezier(0.22, 1, 0.36, 1)` | The one easing curve: fast out, soft settle. |

Utilities in `app.css`: `shine` (CTA sweep), `shine-text`, `animate-marquee`, `animate-led`, `animate-pulse-ring`, `animate-float`, `animate-rise`, `animate-travel`, `animate-drive`, `animate-progress`, `animate-word-rise`, `animate-rule-draw`, `animate-vision-*`. Texture utilities: `scanlines`, `hatch`, `safe-marks`, `panel`, `panel-card`, `eyebrow`, `bg-brand-gradient`, `text-brand-gradient`.

## Components

### Button

The action control for every page and the admin: a brand-gradient primary plus quiet outline, secondary, ghost, link and destructive variants.

- **Source:** `src/components/ui/button.tsx` (shadcn/ui + `cva`).
- **Variants:** `default` (brand gradient `color-gradient-from → via → to`, text `color-on-gradient`, with the `shine` sweep), `outline`, `secondary`, `ghost`, `link` (text `signal`), `destructive` (`color-alert`).
- **Sizes:** `xs` 24px, `sm` 32px, `default` 36px, `lg` 40px, plus `icon`, `icon-xs`, `icon-sm`, `icon-lg` squares. Radius `radius-md`.
- **Rules:** one `default` (gradient) button per view, for the page's main goal ("Book a demo"). The second CTA is `outline` ("Explore products"). Verb-first, sentence case.
- Use `asChild` to render a TanStack Router `<Link>` for navigation; a `<button>` only for actions.
- Icon-only buttons need an `aria-label`. Focus ring: 3px `color-ring` at 50%.

### Card

A bordered `surface-panel` container with a header (title, description, optional action) and content, used mainly in the admin.

- **Source:** `src/components/ui/card.tsx` (adapted from beUI). Parts: `Card`, `CardHeader`, `CardTitle` (`as` h2/h3/h4), `CardDescription`, `CardAction`, `CardContent`.
- **Tokens:** `color-card` / `surface-panel` fill, `line` border, `radius-2xl`, `space-5` padding; title 14px semibold `fg`, description 12px `fg-muted`.
- Pick the `CardTitle` level that keeps the page heading order (no skipped levels).
- On marketing pages prefer **Panel** (`panel-card`), which adds the hover lift.

### Panel

The solid "console panel" surface for marketing cards; `panel-card` adds a violet hover border and a 2px lift.

- **Source:** the `panel` and `panel-card` utilities in `src/styles/app.css`. They replaced the old glass/glow cards: no blur, no glow, no shadow.
- **Tokens:** `surface-panel` fill, 1px `line` border; hover border `color-signal-700`, `translateY(-2px)` over `duration-base` with `ease-broadcast`.
- Pair with an **eyebrow** label and a `card-title` H3. Copy opens with a direct one-line answer.
- Product names are always written in full: "Viewixsoft CMS", never "CMS" alone in a title.

### Input

A 36px single-line text field with a visible label, used in the lead, newsletter and admin forms.

- **Source:** `src/components/ui/input.tsx`, with `label.tsx` and `field-input.tsx`.
- **Tokens:** 1px `color-input` (`line`) border, `radius-md`, transparent fill, placeholder `fg-muted`. Focus: border `color-ring` plus a 3px ring at 50%. Invalid (`aria-invalid`): border `color-destructive`.
- Every field has a `<label>`; errors sit under the field and are linked with `aria-describedby`.
- Forms run on TanStack Form with the shared Zod schema; show a disabled pending state and a success state.
- Placeholders show an example value, never the label.

### Checkbox

A checkbox with a drawn checkmark and press feedback, used for consent and multi-select options.

- **Source:** `src/components/ui/checkbox.tsx` (adapted from beUI, animated with Motion; the draw and press are skipped under reduced motion).
- **Props:** `checked`, `onCheckedChange`, `label`, `description`, `disabled`, `id`, `aria-label`.
- **Tokens:** checked fill `signal` with `on-signal` mark; unchecked border `color-ink-500`; `radius-md`; `space-3` gap to the label.
- The consent checkbox on lead forms is required and is never pre-checked.

### SectionHeading

The centered eyebrow, H2 and intro that opens every page section, so headings line up across the site.

- **Source:** `src/components/blocks/SectionHeading.tsx`. Props: `id` (the section's `aria-labelledby` target), `eyebrow?`, `title` (ReactNode), `description?`, `className?`. Wrapped in `Reveal` (fades in on scroll).
- **Eyebrow:** the `eyebrow` utility — JetBrains Mono 11px, `0.14em` tracking, uppercase, colour `signal`.
- **Title:** `section-title` style (36px from sm, 30px below), `color-ink-50`, `text-balance`. Highlight at most one phrase per heading with `text-brand-gradient`.
- **Intro:** `color-ink-400`, max ~42rem. It is the answer-first sentence: state the answer, then the details below.
- Prefer question-style H2s that match real searches ("What is digital signage software?").

## Not synced

- **Components** not documented yet: Select, Combobox, Tabs, Sheet, NavigationMenu, Marquee, NumberTicker, MagicCard, Reveal, StatefulButton, Feedback, and every `components/blocks/*` section other than SectionHeading.
- **Fluid values** (`text-hero`, `text-scene`, `spacing-page-gutter`) are `clamp()` values in code. They are shown at their maximum, and the formula is in each usage note.
- **Utilities and keyframes** in `app.css` (shine, scanlines, hatch, safe-marks and the animation keyframes) are described in prose, not as tokens.
- **Partner and customer logos** in `public/partners` are not included.
