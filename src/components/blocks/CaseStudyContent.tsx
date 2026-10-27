import { CaseStudySplit } from '~/components/blocks/CaseStudySplit'
import { MarkdownRenderer } from '~/components/blog/MarkdownRenderer'
import { imageSides } from '~/lib/case-study'
import type { ContentSection } from '~/lib/case-study'

/**
 * The article: as many blocks as the story needs. Blocks with an image sit in
 * two columns and alternate sides (text | image, image | text…).
 */
export function CaseStudyContent({ sections }: { sections: ContentSection[] }) {
  if (sections.length === 0) return null
  const sides = imageSides(sections)
  return (
    <div className="space-y-24 md:space-y-32">
      {sections.map((section, i) => (
        <CaseStudySplit key={`${i}-${section.heading}`} id={`section-${i + 1}`} title={section.heading} image={section.image} imageSide={sides[i]}>
          <MarkdownRenderer content={section.body} className="text-lg" />
        </CaseStudySplit>
      ))}
    </div>
  )
}
