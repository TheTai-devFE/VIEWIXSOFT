import { useState } from 'react'
import type { z } from 'zod'
import { ImagePickerSheet } from '~/components/admin/ImagePickerSheet'
import type { LibraryAsset } from '~/components/admin/ImagePickerSheet'
import { RepeatableList, TextField, textareaClass } from '~/components/admin/use-cases/BlockFields'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { PRODUCT_AVAILABILITY } from '~/lib/seo/custom-schema'
import type {
  CustomDataSchema,
  CustomSchemaInputSchema,
  FaqDataSchema,
  HowToDataSchema,
  ImageGalleryDataSchema,
  ProductDataSchema,
  RecipeDataSchema,
  ServiceDataSchema,
} from '~/lib/seo/custom-schema'

/** The schema as the form holds it, before validation. */
export type SchemaDraft = z.input<typeof CustomSchemaInputSchema>

type Props<T> = { id: string; data: T; onChange: (data: T) => void; assets: LibraryAsset[] }

const DURATION_HINT = 'Dạng ISO 8601: PT30M = 30 phút, PT1H15M = 1 giờ 15 phút.'

/** A list edited as text, one item per line. Empty lines are dropped when saving. */
function LinesField({ id, label, value, onChange, hint }: { id: string; label: string; value: string[] | undefined; onChange: (v: string[]) => void; hint?: string }) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <textarea
        id={id}
        value={(value ?? []).join('\n')}
        onChange={(e) => onChange(e.target.value.split('\n'))}
        rows={4}
        aria-describedby={`${id}-hint`}
        className={textareaClass}
      />
      <p id={`${id}-hint`} className="mt-1 text-[11px] text-muted-foreground">
        {hint ?? 'Mỗi dòng một mục.'}
      </p>
    </div>
  )
}

/** An image link typed in, or picked from the media library. */
function ImageField({ id, label, value, onChange, assets }: { id: string; label: string; value: string | undefined; onChange: (v: string) => void; assets: LibraryAsset[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <TextField id={id} label={label} value={value} onChange={onChange} placeholder="https://… hoặc /images/…" />
      <button type="button" onClick={() => setOpen(true)} className="mt-1 text-xs font-medium text-signal-400 hover:underline">
        Chọn từ thư viện ảnh
      </button>
      <ImagePickerSheet
        open={open}
        onClose={() => setOpen(false)}
        assets={assets}
        currentId={null}
        description="Chọn ảnh cho schema."
        onPick={(asset) => onChange(asset.url)}
      />
    </div>
  )
}

function OfferFields({
  id,
  offer,
  onChange,
  withAvailability = false,
}: {
  id: string
  offer: { price?: string; priceCurrency?: string; availability?: (typeof PRODUCT_AVAILABILITY)[number] } | undefined
  onChange: (offer: { price?: string; priceCurrency?: string; availability?: (typeof PRODUCT_AVAILABILITY)[number] }) => void
  withAvailability?: boolean
}) {
  const o = offer ?? {}
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <TextField id={`${id}-price`} label="Giá (để trống nếu không công khai)" value={o.price} onChange={(price) => onChange({ ...o, price })} placeholder="99" />
      <TextField id={`${id}-currency`} label="Tiền tệ" value={o.priceCurrency ?? 'USD'} onChange={(priceCurrency) => onChange({ ...o, priceCurrency })} />
      {withAvailability && (
        <div>
          <Label htmlFor={`${id}-availability`} className="text-xs text-muted-foreground">
            Tình trạng
          </Label>
          <Select
            id={`${id}-availability`}
            value={o.availability ?? 'InStock'}
            onValueChange={(v) => onChange({ ...o, availability: PRODUCT_AVAILABILITY.find((a) => a === v) ?? 'InStock' })}
            className="mt-1"
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_AVAILABILITY.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

function HowToFields({ id, data, onChange, assets }: Props<z.input<typeof HowToDataSchema>>) {
  const set = (patch: Partial<typeof data>) => onChange({ ...data, ...patch })
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id={`${id}-name`} label="Tên hướng dẫn *" value={data.name} onChange={(name) => set({ name })} placeholder="How to schedule content on 10 screens" />
        <TextField id={`${id}-time`} label="Tổng thời gian" value={data.totalTime} onChange={(totalTime) => set({ totalTime })} placeholder="PT30M" hint={DURATION_HINT} />
        <TextField id={`${id}-desc`} label="Mô tả" value={data.description} onChange={(description) => set({ description })} multiline className="sm:col-span-2" />
        <ImageField id={`${id}-image`} label="Ảnh kết quả" value={data.image} onChange={(image) => set({ image })} assets={assets} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <LinesField id={`${id}-supply`} label="Vật tư cần có" value={data.supply} onChange={(supply) => set({ supply })} />
        <LinesField id={`${id}-tool`} label="Công cụ cần có" value={data.tool} onChange={(tool) => set({ tool })} />
      </div>
      <RepeatableList
        label="bước"
        items={data.steps}
        max={30}
        blank={{ name: '', text: '', image: '' }}
        onChange={(steps) => set({ steps })}
        renderItem={(step, update, i) => (
          <div className="grid gap-3">
            <TextField id={`${id}-step-${i}-name`} label={`Bước ${i + 1}: tiêu đề`} value={step.name} onChange={(name) => update({ name })} />
            <TextField id={`${id}-step-${i}-text`} label="Nội dung *" value={step.text} onChange={(text) => update({ text })} multiline />
            <ImageField id={`${id}-step-${i}-image`} label="Ảnh minh hoạ" value={step.image} onChange={(image) => update({ image })} assets={assets} />
          </div>
        )}
      />
    </div>
  )
}

function FaqFields({ id, data, onChange }: Props<z.input<typeof FaqDataSchema>>) {
  return (
    <RepeatableList
      label="câu hỏi"
      items={data.items}
      max={30}
      blank={{ question: '', answer: '' }}
      onChange={(items) => onChange({ items })}
      renderItem={(item, update, i) => (
        <div className="grid gap-3">
          <TextField id={`${id}-q-${i}`} label={`Câu hỏi ${i + 1} *`} value={item.question} onChange={(question) => update({ question })} />
          <TextField id={`${id}-a-${i}`} label="Câu trả lời *" value={item.answer} onChange={(answer) => update({ answer })} multiline />
        </div>
      )}
    />
  )
}

function RecipeFields({ id, data, onChange, assets }: Props<z.input<typeof RecipeDataSchema>>) {
  const set = (patch: Partial<typeof data>) => onChange({ ...data, ...patch })
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id={`${id}-name`} label="Tên công thức *" value={data.name} onChange={(name) => set({ name })} />
        <ImageField id={`${id}-image`} label="Ảnh món *" value={data.image} onChange={(image) => set({ image })} assets={assets} />
        <TextField id={`${id}-desc`} label="Mô tả" value={data.description} onChange={(description) => set({ description })} multiline className="sm:col-span-2" />
        <TextField id={`${id}-prep`} label="Thời gian chuẩn bị" value={data.prepTime} onChange={(prepTime) => set({ prepTime })} placeholder="PT15M" hint={DURATION_HINT} />
        <TextField id={`${id}-cook`} label="Thời gian nấu" value={data.cookTime} onChange={(cookTime) => set({ cookTime })} placeholder="PT30M" />
        <TextField id={`${id}-total`} label="Tổng thời gian" value={data.totalTime} onChange={(totalTime) => set({ totalTime })} placeholder="PT45M" />
        <TextField id={`${id}-yield`} label="Khẩu phần" value={data.recipeYield} onChange={(recipeYield) => set({ recipeYield })} placeholder="4 servings" />
        <TextField id={`${id}-category`} label="Loại món" value={data.recipeCategory} onChange={(recipeCategory) => set({ recipeCategory })} placeholder="Dessert" />
        <TextField id={`${id}-cuisine`} label="Ẩm thực" value={data.recipeCuisine} onChange={(recipeCuisine) => set({ recipeCuisine })} placeholder="Vietnamese" />
        <TextField id={`${id}-keywords`} label="Từ khoá (cách nhau bởi dấu phẩy)" value={data.keywords} onChange={(keywords) => set({ keywords })} />
        <TextField id={`${id}-calories`} label="Calo" value={data.calories} onChange={(calories) => set({ calories })} placeholder="270 calories" />
      </div>
      <LinesField id={`${id}-ingredients`} label="Nguyên liệu *" value={data.ingredients} onChange={(ingredients) => set({ ingredients })} hint="Mỗi dòng một nguyên liệu, kèm định lượng." />
      <RepeatableList
        label="bước"
        items={data.steps}
        max={30}
        blank={{ text: '' }}
        onChange={(steps) => set({ steps })}
        renderItem={(step, update, i) => (
          <TextField id={`${id}-step-${i}`} label={`Bước ${i + 1} *`} value={step.text} onChange={(text) => update({ text })} multiline />
        )}
      />
    </div>
  )
}

function GalleryFields({ id, data, onChange, assets }: Props<z.input<typeof ImageGalleryDataSchema>>) {
  const set = (patch: Partial<typeof data>) => onChange({ ...data, ...patch })
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id={`${id}-name`} label="Tên bộ ảnh *" value={data.name} onChange={(name) => set({ name })} />
        <TextField id={`${id}-desc`} label="Mô tả" value={data.description} onChange={(description) => set({ description })} />
      </div>
      <RepeatableList
        label="ảnh"
        items={data.images}
        max={50}
        blank={{ url: '', caption: '' }}
        onChange={(images) => set({ images })}
        renderItem={(img, update, i) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <ImageField id={`${id}-img-${i}`} label={`Ảnh ${i + 1} *`} value={img.url} onChange={(url) => update({ url })} assets={assets} />
            <TextField id={`${id}-cap-${i}`} label="Chú thích" value={img.caption} onChange={(caption) => update({ caption })} />
          </div>
        )}
      />
    </div>
  )
}

function ProductFields({ id, data, onChange }: Props<z.input<typeof ProductDataSchema>>) {
  const set = (patch: Partial<typeof data>) => onChange({ ...data, ...patch })
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id={`${id}-name`} label="Tên sản phẩm *" value={data.name} onChange={(name) => set({ name })} />
        <TextField id={`${id}-brand`} label="Thương hiệu" value={data.brand} onChange={(brand) => set({ brand })} placeholder="Viewixsoft" />
        <TextField id={`${id}-desc`} label="Mô tả" value={data.description} onChange={(description) => set({ description })} multiline className="sm:col-span-2" />
        <TextField id={`${id}-sku`} label="SKU" value={data.sku} onChange={(sku) => set({ sku })} />
        <TextField id={`${id}-gtin`} label="GTIN / mã vạch" value={data.gtin} onChange={(gtin) => set({ gtin })} />
      </div>
      <LinesField id={`${id}-images`} label="Ảnh sản phẩm" value={data.images} onChange={(images) => set({ images })} hint="Mỗi dòng một link ảnh (https://… hoặc /…)." />
      <OfferFields id={`${id}-offer`} offer={data.offer} onChange={(offer) => set({ offer })} withAvailability />
    </div>
  )
}

function ServiceFields({ id, data, onChange }: Props<z.input<typeof ServiceDataSchema>>) {
  const set = (patch: Partial<typeof data>) => onChange({ ...data, ...patch })
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id={`${id}-name`} label="Tên dịch vụ *" value={data.name} onChange={(name) => set({ name })} />
        <TextField id={`${id}-type`} label="Loại dịch vụ" value={data.serviceType} onChange={(serviceType) => set({ serviceType })} placeholder="Digital signage installation" />
        <TextField id={`${id}-desc`} label="Mô tả" value={data.description} onChange={(description) => set({ description })} multiline className="sm:col-span-2" />
        <TextField id={`${id}-area`} label="Khu vực phục vụ" value={data.areaServed} onChange={(areaServed) => set({ areaServed })} placeholder="Worldwide" />
        <TextField id={`${id}-url`} label="Link trang dịch vụ (mặc định là trang đang gắn)" value={data.url} onChange={(url) => set({ url })} />
      </div>
      <OfferFields id={`${id}-offer`} offer={data.offer} onChange={(offer) => set({ offer })} />
    </div>
  )
}

/** Free-form markup: label: value rows for a chosen type, or raw JSON-LD. */
function CustomFields({ id, data, onChange }: Props<z.input<typeof CustomDataSchema>>) {
  const [jsonText, setJsonText] = useState(data.mode === 'json' ? JSON.stringify(data.json, null, 2) : '')
  const [jsonError, setJsonError] = useState('')

  const switchMode = (mode: 'fields' | 'json') => {
    if (mode === data.mode) return
    if (mode === 'json') {
      // Carries the rows over so nothing typed is lost.
      const json =
        data.mode === 'fields'
          ? { '@type': data.schemaType, ...Object.fromEntries(data.properties.filter((p) => p.label).map((p) => [p.label, p.value])) }
          : {}
      setJsonText(JSON.stringify(json, null, 2))
      setJsonError('')
      onChange({ mode: 'json', json })
    } else {
      onChange({ mode: 'fields', schemaType: '', properties: [{ label: '', value: '' }] })
    }
  }

  const onJson = (value: string) => {
    setJsonText(value)
    try {
      const parsed: unknown = JSON.parse(value)
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error('not an object')
      setJsonError('')
      onChange({ mode: 'json', json: parsed as Record<string, unknown> })
    } catch {
      setJsonError('JSON chưa hợp lệ. Cần một object { … }.')
    }
  }

  return (
    <div className="space-y-4">
      <Tabs value={data.mode} onValueChange={(mode) => switchMode(mode === 'json' ? 'json' : 'fields')}>
        <TabsList aria-label="Cách nhập">
          <TabsTrigger value="fields">label: value</TabsTrigger>
          <TabsTrigger value="json">JSON</TabsTrigger>
        </TabsList>
      </Tabs>

      {data.mode === 'fields' ? (
        <>
          <TextField
            id={`${id}-type`}
            label="Loại schema (@type) *"
            value={data.schemaType}
            onChange={(schemaType) => onChange({ ...data, schemaType })}
            placeholder="Event"
            hint="Tên loại trên schema.org, ví dụ Event, Course, SoftwareSourceCode."
          />
          <RepeatableList
            label="dòng"
            items={data.properties}
            max={50}
            blank={{ label: '', value: '' }}
            onChange={(properties) => onChange({ ...data, properties })}
            renderItem={(row, update, i) => (
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <TextField id={`${id}-label-${i}`} label="Label" value={row.label} onChange={(label) => update({ label })} placeholder="startDate" />
                <TextField id={`${id}-value-${i}`} label="Value" value={row.value} onChange={(value) => update({ value })} placeholder="2026-12-01" />
              </div>
            )}
          />
        </>
      ) : (
        <div>
          <Label htmlFor={`${id}-json`} className="text-xs text-muted-foreground">
            JSON-LD *
          </Label>
          <textarea
            id={`${id}-json`}
            value={jsonText}
            onChange={(e) => onJson(e.target.value)}
            rows={14}
            spellCheck={false}
            aria-invalid={jsonError ? true : undefined}
            aria-describedby={`${id}-json-hint`}
            className={`${textareaClass} font-mono text-xs`}
          />
          <p id={`${id}-json-hint`} className={jsonError ? 'mt-1 text-[11px] text-destructive' : 'mt-1 text-[11px] text-muted-foreground'}>
            {jsonError || 'Cần có "@type". "@context" luôn được đặt thành https://schema.org.'}
          </p>
        </div>
      )}
    </div>
  )
}

/** The fields for whichever type the draft is. */
export function SchemaFields({ id, draft, onChange, assets }: { id: string; draft: SchemaDraft; onChange: (draft: SchemaDraft) => void; assets: LibraryAsset[] }) {
  switch (draft.type) {
    case 'HowTo':
      return <HowToFields id={id} data={draft.data} onChange={(data) => onChange({ type: 'HowTo', data })} assets={assets} />
    case 'FAQPage':
      return <FaqFields id={id} data={draft.data} onChange={(data) => onChange({ type: 'FAQPage', data })} assets={assets} />
    case 'Recipe':
      return <RecipeFields id={id} data={draft.data} onChange={(data) => onChange({ type: 'Recipe', data })} assets={assets} />
    case 'ImageGallery':
      return <GalleryFields id={id} data={draft.data} onChange={(data) => onChange({ type: 'ImageGallery', data })} assets={assets} />
    case 'Product':
      return <ProductFields id={id} data={draft.data} onChange={(data) => onChange({ type: 'Product', data })} assets={assets} />
    case 'Service':
      return <ServiceFields id={id} data={draft.data} onChange={(data) => onChange({ type: 'Service', data })} assets={assets} />
    case 'Custom':
      return <CustomFields id={id} data={draft.data} onChange={(data) => onChange({ type: 'Custom', data })} assets={assets} />
  }
}

/** Drops the blank lines left by one-item-per-line fields before validation. */
export function cleanDraft(draft: SchemaDraft): SchemaDraft {
  const lines = (list: string[] | undefined) => (list ?? []).map((s) => s.trim()).filter(Boolean)
  switch (draft.type) {
    case 'HowTo':
      return { ...draft, data: { ...draft.data, supply: lines(draft.data.supply), tool: lines(draft.data.tool) } }
    case 'Recipe':
      return { ...draft, data: { ...draft.data, ingredients: lines(draft.data.ingredients) } }
    case 'Product':
      return { ...draft, data: { ...draft.data, images: lines(draft.data.images) } }
    default:
      return draft
  }
}
