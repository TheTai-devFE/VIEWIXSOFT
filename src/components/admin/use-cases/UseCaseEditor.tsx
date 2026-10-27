import { useState } from 'react'
import { useConfirm, useToast } from '~/components/ui/feedback'
import { useRouter } from '@tanstack/react-router'
import { Image as ImageIcon, Trash2 } from 'lucide-react'
import { EditorHeader } from '~/components/admin/EditorHeader'
import { ImagePickerSheet } from '~/components/admin/ImagePickerSheet'
import { AnimatedBadge } from '~/components/ui/animated-badge'
import { OwnershipNotice } from '~/components/admin/OwnershipNotice'
import type { Ownership } from '~/components/admin/OwnershipNotice'
import type { LibraryAsset } from '~/components/admin/ImagePickerSheet'
import { BlockCard, ProductSelect, RepeatableList, TextField, selectClass } from '~/components/admin/use-cases/BlockFields'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { PRODUCTS } from '~/content/products'
import { legacySections } from '~/content/useCases'
import { UseCaseFormSchema } from '~/lib/admin-schemas'
import { describeIssue } from '~/components/admin/use-cases/form-errors'
import { HIGHLIGHT_ICONS, imageSides } from '~/lib/case-study'
import type { CaseStudyBlocks, CaseStudyResult, ContentSection, SectionImage } from '~/lib/case-study'
import { createUseCaseFn, deleteUseCaseFn, updateUseCaseFn } from '~/server/functions/use-cases'
import type { UseCaseRow } from '~/server/db/schema'
import { cn } from '~/lib/cn'
import { LazyImage } from '~/components/ui/lazy-image'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const productName = (slug: string) => PRODUCTS.find((p) => p.slug === slug)?.name ?? slug

const BLANK_SECTION: ContentSection = { heading: '', body: '' }

function blocksFromRow(row: UseCaseRow | null | undefined): CaseStudyBlocks {
  if (!row) {
    // A new page starts with two empty content blocks; more can be added.
    return { mode: 'guide', highlights: [], sections: [BLANK_SECTION, BLANK_SECTION], setup: [], stories: [], faq: [], reviewedBy: null }
  }
  return {
    mode: row.mode,
    highlights: row.highlights,
    // Pages written before content blocks existed open with their challenge and solution as two blocks.
    sections: row.sections.length > 0 ? row.sections : legacySections(row),
    setup: row.setup,
    stories: row.stories,
    faq: row.faq,
    reviewedBy: row.reviewedBy,
  }
}

/** Drops rows left completely empty so an unused block does not block saving. */
function cleanBlocks(b: CaseStudyBlocks): CaseStudyBlocks {
  return {
    ...b,
    sections: b.sections.filter((s) => s.heading.trim() || s.body.trim() || s.image),
    highlights: b.highlights.filter((h) => h.title.trim() || h.description.trim()),
    reviewedBy: b.reviewedBy?.name.trim() ? b.reviewedBy : null,
  }
}

/**
 * The image beside a content block. Says which side it lands on; without an
 * image the block's text keeps one readable column on the page.
 */
function SectionImageField({
  id,
  image,
  side,
  onChoose,
  onChange,
}: {
  id: string
  image: SectionImage | undefined
  side: 'left' | 'right' | undefined
  onChoose: () => void
  onChange: (image: SectionImage | undefined) => void
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-border p-3">
      {image ? (
        <LazyImage src={image.url} alt="" className="h-16 w-24 rounded-md object-cover" />
      ) : (
        <span className="flex h-16 w-24 items-center justify-center rounded-md bg-muted/40">
          <ImageIcon aria-hidden="true" className="size-5 text-muted-foreground" />
        </span>
      )}
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-xs text-muted-foreground">
          {side ? `Ảnh nằm bên ${side === 'left' ? 'trái' : 'phải'} phần chữ.` : 'Ảnh đặt cạnh phần chữ (không bắt buộc, tỉ lệ 4:3 đẹp nhất).'}
        </p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onChoose} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent">
            {image ? 'Đổi ảnh' : 'Thêm ảnh'}
          </button>
          {image && (
            <button type="button" onClick={() => onChange(undefined)} className="text-xs text-destructive hover:underline">
              Bỏ ảnh
            </button>
          )}
        </div>
      </div>
      {image && (
        <TextField id={`${id}-alt`} label="Alt text (mô tả ảnh bằng tiếng Anh)" value={image.alt} onChange={(alt) => onChange({ ...image, alt })} className="basis-full" />
      )}
    </div>
  )
}

export function UseCaseEditor({
  initialUseCase,
  mediaAssets = [],
  ownership,
}: {
  initialUseCase?: UseCaseRow | null
  mediaAssets?: LibraryAsset[]
  /** Set when editing an existing case study. */
  ownership?: Ownership
}) {
  const canEdit = ownership?.canEdit ?? true
  const router = useRouter()
  const confirm = useConfirm()
  const toast = useToast()
  const isEditing = Boolean(initialUseCase?.id)

  const [title, setTitle] = useState(initialUseCase?.title ?? '')
  const [slug, setSlug] = useState(initialUseCase?.slug ?? '')
  const [seoTitle, setSeoTitle] = useState(initialUseCase?.seoTitle ?? '')
  const [industry, setIndustry] = useState(initialUseCase?.industry ?? 'Retail')
  const [tagline, setTagline] = useState(initialUseCase?.tagline ?? '')
  const [coverUrl, setCoverUrl] = useState(initialUseCase?.coverUrl ?? '')
  const [coverAlt, setCoverAlt] = useState(initialUseCase?.coverAlt ?? '')
  const [results, setResults] = useState<CaseStudyResult[]>(initialUseCase?.results ?? [])
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    (initialUseCase?.featuredProducts ?? []).map((p) => p.slug),
  )
  const [blocks, setBlocks] = useState<CaseStudyBlocks>(() => blocksFromRow(initialUseCase))
  const setBlock = <K extends keyof CaseStudyBlocks>(key: K, value: CaseStudyBlocks[K]) =>
    setBlocks((prev) => ({ ...prev, [key]: value }))

  // Which picker is open: the thumbnail, or a content block's image by index.
  const [picker, setPicker] = useState<{ target: 'cover' } | { target: 'section'; index: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const isStory = blocks.mode === 'story'
  const sides = imageSides(blocks.sections)

  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (!isEditing && (!slug || slug === slugify(title))) setSlug(slugify(val))
  }

  const handleProductToggle = (productSlug: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productSlug) ? prev.filter((s) => s !== productSlug) : [...prev, productSlug],
    )
  }

  const handleSave = async (status: 'draft' | 'published') => {
    setErrors([])

    // Products in the recommended list also tag the page for the product filter and cards.
    const setupSlugs = blocks.setup.flatMap((s) => (s.productSlug ? [s.productSlug] : []))
    const featuredProducts = [...new Set([...selectedProducts, ...setupSlugs])].map((s) => ({ slug: s, name: productName(s) }))

    const parsed = UseCaseFormSchema.safeParse({
      title,
      slug: slugify(slug),
      seoTitle: seoTitle.trim() || undefined,
      industry,
      tagline,
      coverUrl: coverUrl.trim() || undefined,
      coverAlt: coverAlt.trim() || undefined,
      results: isStory ? results.filter((r) => r.metric.trim() || r.label.trim()) : results,
      // The single quote field is retired; customer quotes now live in stories.
      quote: initialUseCase?.quote ?? null,
      featuredProducts,
      status,
      ...cleanBlocks(blocks),
    })
    if (!parsed.success) {
      setErrors(parsed.error.issues.map(describeIssue))
      return
    }

    setSaving(true)
    try {
      const res =
        isEditing && initialUseCase?.id
          ? await updateUseCaseFn({ data: { id: initialUseCase.id, data: parsed.data } })
          : await createUseCaseFn({ data: parsed.data })
      if (!res.ok) {
        setErrors([res.message || 'Không lưu được. Hãy thử lại.'])
        setSaving(false)
        return
      }
      await router.navigate({ to: '/admin/use-cases' })
    } catch {
      setErrors(['Không lưu được. Hãy thử lại; nếu vẫn lỗi, kiểm tra log server.'])
      setSaving(false)
    }
  }

  const handleDelete = () => {
    const id = initialUseCase?.id
    if (!id) return
    void confirm({
      title: 'Xoá case study này?',
      description: 'Case study bị xoá vĩnh viễn và không thể hoàn tác.',
      confirmText: 'Xoá case study',
      tone: 'danger',
      onConfirm: async () => {
        const res = await deleteUseCaseFn({ data: { id } })
        if (!res.ok) return 'Không xoá được case study. Hãy thử lại.'
        toast({ title: 'Đã xoá case study', tone: 'success' })
        await router.navigate({ to: '/admin/use-cases' })
      },
    })
  }

  const canSave = !saving && title.trim() && tagline.trim()

  return (
    <div className="space-y-8">
      <EditorHeader
        title={isEditing ? 'Sửa case study' : 'Thêm case study'}
        backLabel="Quay lại danh sách case study"
        onBack={() => router.navigate({ to: '/admin/use-cases' })}
        status={initialUseCase?.status}
        publishedAt={initialUseCase?.publishedAt}
        badges={
          <AnimatedBadge status={isStory ? 'info' : 'neutral'} size="sm">
            {isStory ? 'Customer story' : 'Industry guide'}
          </AnimatedBadge>
        }
        actions={
          canEdit && (
            <>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3.5 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  <Trash2 aria-hidden="true" className="size-4" /> Xoá
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSave('draft')}
                disabled={!canSave}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
              >
                {saving ? 'Đang lưu…' : 'Lưu nháp'}
              </button>
              <button
                type="button"
                onClick={() => handleSave('published')}
                disabled={!canSave}
                className="bg-brand-gradient inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-on-gradient hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Đang đăng…' : initialUseCase?.status === 'published' ? 'Cập nhật' : 'Đăng bài'}
              </button>
            </>
          )
        }
      />

      {ownership && <OwnershipNotice ownership={ownership} kind="case study" />}

      {errors.length > 0 && (
        <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-semibold">Cần sửa trước khi lưu:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Read-only when the case study is someone else's. */}
      <fieldset disabled={!canEdit} className="min-w-0">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {/* Title, slug and summary work the same way as a blog post. */}
            <div>
              <Label htmlFor="uc-title" className="text-base font-semibold">
                Tiêu đề *
              </Label>
              <Input
                id="uc-title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Digital menu boards for quick-service restaurants"
                className="mt-2 h-12 text-lg font-medium"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="uc-slug" className="text-sm font-medium">
                  URL slug *
                </Label>
                <button
                  type="button"
                  onClick={() => setSlug(slugify(title))}
                  className="text-xs font-semibold text-signal-400 hover:text-signal-300"
                >
                  Tạo từ tiêu đề
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">/case-studies/</span>
                <Input id="uc-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="qsr-menu-boards" className="font-mono text-sm" required />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="uc-tagline" className="text-sm font-medium">
                  Tóm tắt *
                </Label>
                <span className={cn('font-mono text-xs', tagline.length > 155 ? 'font-semibold text-destructive' : 'text-muted-foreground')}>
                  {tagline.length} / 155
                </span>
              </div>
              <textarea
                id="uc-tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                rows={3}
                placeholder="1–2 câu (tiếng Anh) nói trang này về cái gì. Hiện dưới tiêu đề, trên card và trong kết quả Google."
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                required
              />
            </div>

            <BlockCard
              title="Điểm nổi bật"
              note="không bắt buộc, tối đa 3"
              tip="Hàng nằm dưới thumbnail. Vài chữ nói kết quả, rồi một câu nói cách đạt được."
            >
              <RepeatableList
                label="điểm nổi bật"
                items={blocks.highlights}
                max={3}
                blank={{ icon: 'calendar-clock' as const, title: '', description: '' }}
                onChange={(v) => setBlock('highlights', v)}
                renderItem={(item, update, i) => (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <Label htmlFor={`highlight-icon-${i}`} className="text-xs text-muted-foreground">
                        Biểu tượng
                      </Label>
                      <select
                        id={`highlight-icon-${i}`}
                        value={item.icon}
                        onChange={(e) => {
                          const icon = HIGHLIGHT_ICONS.find((x) => x === e.target.value)
                          if (icon) update({ icon })
                        }}
                        className={selectClass}
                      >
                        {HIGHLIGHT_ICONS.map((icon) => (
                          <option key={icon} value={icon}>
                            {icon}
                          </option>
                        ))}
                      </select>
                    </div>
                    <TextField
                      id={`highlight-title-${i}`}
                      label="Tiêu đề"
                      value={item.title}
                      onChange={(title) => update({ title })}
                      placeholder="Prices always match"
                      className="sm:col-span-2"
                    />
                    <TextField
                      id={`highlight-description-${i}`}
                      label="Một câu mô tả"
                      value={item.description}
                      onChange={(description) => update({ description })}
                      multiline
                      className="sm:col-span-3"
                    />
                  </div>
                )}
              />
            </BlockCard>

            <BlockCard
              title="Nội dung"
              note="bài dài thì thêm mục, bài ngắn để 1–2 mục"
              tip="Mỗi mục gồm tiêu đề và nội dung (viết bằng tiếng Anh). Câu đầu tiên của mỗi mục nên trả lời thẳng tiêu đề. Nội dung hỗ trợ Markdown: **in đậm**, - gạch đầu dòng, [link](/products/cms). Mục có ảnh sẽ xen kẽ trái/phải trên trang."
            >
              <RepeatableList
                label="mục"
                items={blocks.sections}
                max={10}
                blank={BLANK_SECTION}
                onChange={(v) => setBlock('sections', v)}
                renderItem={(item, update, i) => (
                  <div className="space-y-3">
                    <TextField
                      id={`section-heading-${i}`}
                      label={`Tiêu đề mục ${i + 1}`}
                      value={item.heading}
                      onChange={(heading) => update({ heading })}
                      placeholder={i === 0 ? 'Why do menu board prices drift from the register?' : 'How does Viewixsoft keep menu boards in sync?'}
                    />
                    <TextField
                      id={`section-body-${i}`}
                      label="Nội dung"
                      value={item.body}
                      onChange={(body) => update({ body })}
                      multiline
                      rows={6}
                    />
                    <SectionImageField
                      id={`section-image-${i}`}
                      image={item.image}
                      side={sides[i]}
                      onChoose={() => setPicker({ target: 'section', index: i })}
                      onChange={(image) => update({ image })}
                    />
                  </div>
                )}
              />
            </BlockCard>

            <BlockCard
              title="Sản phẩm"
              note="không bắt buộc"
              tip="Hiện thành các card sản phẩm nền tối. Nói sản phẩm làm gì cho CHÍNH ngành này. Sản phẩm chưa ra mắt tự có nhãn Coming soon."
            >
              <RepeatableList
                label="sản phẩm"
                items={blocks.setup}
                max={8}
                blank={{ productSlug: 'cms', name: productName('cms'), role: '', need: 'core' as const }}
                onChange={(v) => setBlock('setup', v)}
                renderItem={(item, update, i) => (
                  <div className="grid gap-3 sm:grid-cols-6">
                    <ProductSelect
                      id={`setup-product-${i}`}
                      label="Sản phẩm"
                      value={item.productSlug}
                      noneLabel="Phần cứng / khác"
                      onChange={(productSlug) => update({ productSlug, name: productSlug ? productName(productSlug) : '' })}
                      className="sm:col-span-2"
                    />
                    {item.productSlug === null ? (
                      <TextField
                        id={`setup-name-${i}`}
                        label="Tên"
                        value={item.name}
                        onChange={(name) => update({ name })}
                        placeholder="Viewix displays"
                        className="sm:col-span-2"
                      />
                    ) : (
                      <div className="sm:col-span-2" />
                    )}
                    <div className="sm:col-span-2">
                      <Label htmlFor={`setup-need-${i}`} className="text-xs text-muted-foreground">
                        Vai trò
                      </Label>
                      <select
                        id={`setup-need-${i}`}
                        value={item.need}
                        onChange={(e) => update({ need: e.target.value === 'add-on' ? 'add-on' : 'core' })}
                        className={selectClass}
                      >
                        <option value="core">Core (cốt lõi)</option>
                        <option value="add-on">Add-on (bổ sung)</option>
                      </select>
                    </div>
                    <TextField
                      id={`setup-role-${i}`}
                      label="Sản phẩm làm gì trong ngành này (không bắt buộc)"
                      value={item.role}
                      onChange={(role) => update({ role })}
                      className="sm:col-span-6"
                    />
                  </div>
                )}
              />
            </BlockCard>

            <BlockCard
              title="Câu chuyện khách hàng và kết quả"
              note="chỉ dùng cho Customer story"
              tip={
                isStory
                  ? 'Chỉ dùng trích dẫn và số liệu đã được khách hàng đồng ý bằng văn bản. Khách có thể ẩn danh (chỉ ghi chức danh và nhóm). Mỗi con số cần ghi kỳ đo và nguồn.'
                  : 'Bị ẩn ở bài Industry guide. Chuyển loại trang sang Customer story khi đã có trích dẫn hoặc số liệu được khách đồng ý.'
              }
            >
              {isStory && (
                <>
                  <RepeatableList
                    label="câu chuyện"
                    items={blocks.stories}
                    max={6}
                    blank={{ topic: '', quote: '', role: '', team: '' }}
                    onChange={(v) => setBlock('stories', v)}
                    renderItem={(item, update, i) => (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <TextField id={`story-topic-${i}`} label="Chủ đề" value={item.topic} onChange={(topic) => update({ topic })} className="sm:col-span-2" />
                        <TextField id={`story-quote-${i}`} label="Trích dẫn (tiếng Anh)" value={item.quote} onChange={(quote) => update({ quote })} multiline className="sm:col-span-2" />
                        <TextField id={`story-role-${i}`} label="Chức danh" value={item.role} onChange={(role) => update({ role })} placeholder="Operations Manager" />
                        <TextField id={`story-team-${i}`} label="Nhóm / loại công ty" value={item.team} onChange={(team) => update({ team })} placeholder="Burger chain, 60 stores" />
                      </div>
                    )}
                  />
                  <div className="border-t border-border pt-4">
                    <RepeatableList
                      label="kết quả"
                      items={results}
                      max={3}
                      blank={{ metric: '', label: '', baseline: '', period: '', source: '' }}
                      onChange={setResults}
                      renderItem={(item, update, i) => (
                        <div className="grid gap-3 sm:grid-cols-3">
                          <TextField id={`result-metric-${i}`} label="Con số" value={item.metric} onChange={(metric) => update({ metric })} placeholder="+18%" />
                          <TextField id={`result-label-${i}`} label="Đo cái gì" value={item.label} onChange={(label) => update({ label })} className="sm:col-span-2" />
                          <TextField id={`result-baseline-${i}`} label="Trước khi triển khai (không bắt buộc)" value={item.baseline} onChange={(baseline) => update({ baseline })} />
                          <TextField id={`result-period-${i}`} label="Kỳ đo *" value={item.period} onChange={(period) => update({ period })} placeholder="Mar–Jun 2026" />
                          <TextField id={`result-source-${i}`} label="Nguồn *" value={item.source} onChange={(source) => update({ source })} placeholder="Viewixsoft Tracking" />
                        </div>
                      )}
                    />
                  </div>
                </>
              )}
            </BlockCard>

            <BlockCard title="FAQ" note="không bắt buộc" tip="Những câu sales hay được hỏi trong ngành này. Câu đầu tiên của câu trả lời phải trả lời thẳng.">
              <RepeatableList
                label="câu hỏi"
                items={blocks.faq}
                max={8}
                blank={{ question: '', answer: '' }}
                onChange={(v) => setBlock('faq', v)}
                renderItem={(item, update, i) => (
                  <div className="grid gap-3">
                    <TextField id={`faq-q-${i}`} label="Câu hỏi" value={item.question} onChange={(question) => update({ question })} />
                    <TextField id={`faq-a-${i}`} label="Câu trả lời" value={item.answer} onChange={(answer) => update({ answer })} multiline />
                  </div>
                )}
              />
            </BlockCard>
          </div>

          <div className="space-y-6 lg:col-span-4">
            {/* Thumbnail works the same way as a blog post's cover. */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <Label className="text-sm font-semibold">Ảnh thumbnail</Label>
              <p className="mt-1 text-xs text-muted-foreground">Tỉ lệ 16:9. Hiện dưới tiêu đề và trên card.</p>
              {coverUrl ? (
                <div className="mt-3 overflow-hidden rounded-xl border border-border">
                  <img src={coverUrl} alt={coverAlt || 'Thumbnail'} className="aspect-video w-full object-cover" />
                  <div className="flex items-center justify-between bg-ink-950 p-2">
                    <span className="truncate text-xs text-muted-foreground">{coverUrl}</span>
                    <button type="button" onClick={() => setCoverUrl('')} className="text-xs text-destructive hover:underline">
                      Bỏ ảnh
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPicker({ target: 'cover' })}
                  className="mt-3 flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-ink-950/50 p-4 text-center hover:border-signal-400"
                >
                  <ImageIcon aria-hidden="true" className="size-6 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">Chọn từ thư viện ảnh</span>
                </button>
              )}
              <TextField id="uc-cover-alt" label="Alt text (mô tả ảnh bằng tiếng Anh)" value={coverAlt} onChange={setCoverAlt} className="mt-3" />
            </div>

            <fieldset className="space-y-3 rounded-2xl border border-border bg-card p-5">
              <legend className="sr-only">Loại trang</legend>
              <p className="text-sm font-semibold">Loại trang</p>
              {(
                [
                  { value: 'guide', label: 'Industry guide', help: 'Bài giải pháp theo ngành do Viewixsoft viết. Không hiện trích dẫn hay số liệu khách hàng.' },
                  { value: 'story', label: 'Customer story', help: 'Chỉ dùng khi có khách hàng thật đã đồng ý bằng văn bản cho trích dẫn và số liệu.' },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    'flex cursor-pointer gap-3 rounded-lg border p-3 text-sm',
                    blocks.mode === opt.value ? 'border-signal-400 bg-signal-500/5' : 'border-border hover:bg-muted/40',
                  )}
                >
                  <input
                    type="radio"
                    name="uc-mode"
                    value={opt.value}
                    checked={blocks.mode === opt.value}
                    onChange={() => setBlock('mode', opt.value)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block font-medium text-foreground">{opt.label}</span>
                    <span className="block text-xs text-muted-foreground">{opt.help}</span>
                  </span>
                </label>
              ))}
          </fieldset>

          <div className="rounded-2xl border border-border bg-card p-5">
            <Label htmlFor="uc-industry" className="text-sm font-semibold">
              Ngành *
            </Label>
            <Input
              id="uc-industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Retail, Healthcare, Hospitality…"
              className="mt-2 text-sm"
              required
            />
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-semibold">Gắn thẻ sản phẩm</p>
            <p className="mt-1 text-xs text-muted-foreground">Dùng cho bộ lọc sản phẩm và card. Sản phẩm đã thêm ở khối Sản phẩm sẽ tự được gắn thẻ.</p>
            <div className="mt-3 space-y-2">
              {PRODUCTS.map((p) => (
                <label key={p.slug} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-2 text-sm hover:bg-muted/40">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(p.slug)}
                    onChange={() => handleProductToggle(p.slug)}
                    className="size-4 rounded border-border"
                  />
                  <span className="font-medium text-foreground">{p.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-semibold">Người duyệt nội dung</p>
            <p className="text-xs text-muted-foreground">Không bắt buộc. Hiện cạnh ngày cập nhật (viết bằng tiếng Anh).</p>
            <TextField
              id="uc-reviewer-name"
              label="Họ tên"
              value={blocks.reviewedBy?.name}
              onChange={(name) => setBlock('reviewedBy', { name, role: blocks.reviewedBy?.role ?? '' })}
            />
            <TextField
              id="uc-reviewer-role"
              label="Chức danh"
              value={blocks.reviewedBy?.role}
              onChange={(role) => setBlock('reviewedBy', { name: blocks.reviewedBy?.name ?? '', role })}
              placeholder="Solutions Engineer"
            />
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-semibold">Tiêu đề tìm kiếm (SEO)</p>
            <TextField
              id="uc-seotitle"
              label="Tối đa 47 ký tự, để thêm “ — Viewixsoft” vẫn không quá 60"
              value={seoTitle}
              onChange={setSeoTitle}
              hint={`${seoTitle.length}/47 ký tự`}
              className="mt-2"
            />
          </div>
        </div>
      </div>
      </fieldset>

      <ImagePickerSheet
        open={picker !== null}
        onClose={() => setPicker(null)}
        assets={mediaAssets}
        currentId={null}
        description="Chọn một ảnh đã tải lên thư viện."
        onPick={(asset) => {
          if (picker?.target === 'cover') {
            setCoverUrl(asset.url)
            if (!coverAlt) setCoverAlt(asset.alt)
          } else if (picker?.target === 'section') {
            const index = picker.index
            setBlock(
              'sections',
              blocks.sections.map((s, i) => (i === index ? { ...s, image: { url: asset.url, alt: s.image?.alt || asset.alt } } : s)),
            )
          }
          setPicker(null)
        }}
      />
    </div>
  )
}
