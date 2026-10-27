/**
 * Shapes of the case study page blocks. Shared by the database schema, the
 * admin editor, the server functions and the public page. Kept free of `~/`
 * imports because drizzle-kit loads it through src/server/db/schema.ts
 * without the alias.
 */
import { z } from 'zod'

/**
 * `guide` is an industry guide written without customer data; results and
 * quotes stay hidden. `story` is a real, approved customer story: only then do
 * figures, customer quotes and the "Customer story" badge appear.
 */
export const CASE_STUDY_MODES = ['guide', 'story'] as const
export type CaseStudyMode = (typeof CASE_STUDY_MODES)[number]

const text = (max: number) => z.string().trim().min(1).max(max)
const optionalText = (max: number) => z.string().trim().max(max).optional()

/** Line icons a highlight can use; the page maps each name to a Lucide icon. */
export const HIGHLIGHT_ICONS = [
  'calendar-clock',
  'monitor',
  'refresh',
  'map-pin',
  'chart',
  'tag',
  'wifi-off',
  'layers',
  'tap',
  'users',
  'shield',
  'zap',
] as const
export type HighlightIcon = (typeof HIGHLIGHT_ICONS)[number]

/** One of up to three outcomes under the hero: a few words plus one sentence. */
export const HighlightSchema = z.object({
  icon: z.enum(HIGHLIGHT_ICONS),
  title: text(60),
  description: text(220),
})

export const SectionImageSchema = z.object({ url: text(500), alt: z.string().trim().max(200) })

/**
 * One block of the article: a heading, Markdown text and an optional image.
 * A page has as many as it needs, short or long; with an image, blocks sit
 * in two columns and alternate sides down the page.
 */
export const ContentSectionSchema = z.object({
  heading: text(160),
  body: text(6000),
  image: SectionImageSchema.optional(),
})

export const SetupItemSchema = z.object({
  /** A Viewixsoft product slug; null for hardware or anything that is not a product. */
  productSlug: z.string().trim().max(40).nullable(),
  name: text(80),
  /** What it does in this industry; optional, the card shows only the name without it. */
  role: z.string().trim().max(240),
  need: z.enum(['core', 'add-on']),
})

/**
 * A short customer quote about one task. Customers may stay anonymous (role
 * and team only), but the words must be theirs and approved in writing.
 */
export const StorySchema = z.object({
  topic: text(60),
  quote: text(500),
  role: text(80),
  team: text(100),
})

export const ResultSchema = z.object({
  metric: text(40),
  label: text(120),
  baseline: optionalText(80),
  period: optionalText(80),
  source: optionalText(160),
})

export const FaqEntrySchema = z.object({ question: text(160), answer: text(800) })

export const ReviewerSchema = z.object({ name: text(100), role: text(100) })

export type Highlight = z.infer<typeof HighlightSchema>
export type SectionImage = z.infer<typeof SectionImageSchema>
export type ContentSection = z.infer<typeof ContentSectionSchema>
export type SetupItem = z.infer<typeof SetupItemSchema>
export type Story = z.infer<typeof StorySchema>
export type CaseStudyResult = z.infer<typeof ResultSchema>
export type FaqEntry = z.infer<typeof FaqEntrySchema>
export type Reviewer = z.infer<typeof ReviewerSchema>

/** The page blocks a case study has on top of its title, summary and cover. */
export const CaseStudyBlocksSchema = z.object({
  mode: z.enum(CASE_STUDY_MODES).default('guide'),
  highlights: z.array(HighlightSchema).max(3).default([]),
  sections: z.array(ContentSectionSchema).max(10).default([]),
  setup: z.array(SetupItemSchema).max(8).default([]),
  stories: z.array(StorySchema).max(6).default([]),
  faq: z.array(FaqEntrySchema).max(8).default([]),
  reviewedBy: ReviewerSchema.nullable().optional(),
})

export type CaseStudyBlocks = z.infer<typeof CaseStudyBlocksSchema>

export const EMPTY_CASE_STUDY_BLOCKS: CaseStudyBlocks = {
  mode: 'guide',
  highlights: [],
  sections: [],
  setup: [],
  stories: [],
  faq: [],
  reviewedBy: null,
}

/**
 * Which side each content block puts its image on: text then image, image
 * then text, and so on, counting only blocks that have an image so two
 * picture rows never face the same way.
 */
export function imageSides(sections: Pick<ContentSection, 'image'>[]): ('left' | 'right' | undefined)[] {
  let shown = 0
  return sections.map((s) => {
    if (!s.image) return undefined
    return shown++ % 2 === 0 ? 'right' : 'left'
  })
}

/**
 * A customer story publishes customer evidence, so it needs some, and each
 * figure must say when and how it was measured. An industry guide never shows
 * figures or quotes, so it is not checked. Messages are admin UI copy, so
 * they are in Vietnamese (see AGENTS.md §0.6).
 */
export function storyProblems(input: { mode: CaseStudyMode; results: CaseStudyResult[]; stories?: Story[] }): string[] {
  if (input.mode !== 'story') return []
  const problems: string[] = []
  if (input.results.length === 0 && (input.stories ?? []).length === 0) {
    problems.push('Bài Customer story cần ít nhất một kết quả đo được hoặc một trích dẫn của khách hàng.')
  }
  input.results.forEach((r, i) => {
    if (!r.period) problems.push(`Kết quả ${i + 1}: cần ghi kỳ đo (ví dụ: Tháng 3–6/2026).`)
    if (!r.source) problems.push(`Kết quả ${i + 1}: cần ghi nguồn (đo bằng cách nào).`)
  })
  return problems
}
