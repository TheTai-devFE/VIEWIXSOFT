import { Link } from '@tanstack/react-router'
import { BookOpenText, Check, X } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { buttonSecondary } from '~/components/admin/admin-ui'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { DESCRIPTION_MAX, TITLE_MAX } from '~/lib/seo/meta'

// Admin UI copy, so it is in Vietnamese (AGENTS.md §0.6). Examples stay in English,
// because that is the language of the public site.

const TABS = [
  { value: 'start', label: 'Bắt đầu' },
  { value: 'seo', label: 'Google' },
  { value: 'geo', label: 'AI' },
  { value: 'checklist', label: 'Checklist' },
  { value: 'measure', label: 'Đo kết quả' },
] as const
type TabValue = (typeof TABS)[number]['value']

const SUFFIX = ' — Viewixsoft'

function H({ children }: { children: ReactNode }) {
  return <h3 className="mt-6 text-sm font-semibold text-foreground first:mt-0">{children}</h3>
}

function P({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
}

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="mt-3 space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
          <span className="font-mono text-xs leading-6 text-signal-400">{String(i + 1).padStart(2, '0')}</span>
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ol>
  )
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-border">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

/** A good and a weak version side by side. */
function Example({ good, bad, note }: { good: string; bad: string; note: string }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border text-sm">
      <p className="flex gap-2 border-b border-border bg-success/5 px-3 py-2 text-foreground">
        <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
        <span>
          <span className="sr-only">Nên: </span>
          {good}
        </span>
      </p>
      <p className="flex gap-2 px-3 py-2 text-muted-foreground">
        <X aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
        <span>
          <span className="sr-only">Tránh: </span>
          {bad}
        </span>
      </p>
      <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">{note}</p>
    </div>
  )
}

function Tip({ children }: { children: ReactNode }) {
  return <p className="mt-4 rounded-xl border border-signal-500/30 bg-signal-500/5 p-3 text-sm leading-relaxed text-foreground">{children}</p>
}

const linkClass = 'font-medium text-signal-400 underline-offset-2 hover:underline'

function StartTab({ onNavigate }: { onNavigate: () => void }) {
  const go = (to: '/admin/blog' | '/admin/authors' | '/admin/use-cases' | '/admin/pages', label: string) => (
    <Link to={to} onClick={onNavigate} className={linkClass}>
      {label}
    </Link>
  )
  return (
    <>
      <H>SEO và GEO khác nhau thế nào?</H>
      <P>
        <strong className="text-foreground">SEO</strong> giúp trang lên cao trong kết quả tìm kiếm Google.{' '}
        <strong className="text-foreground">GEO</strong> giúp ChatGPT, Claude, Perplexity và Google AI Overviews đọc, trích dẫn và
        giới thiệu Viewixsoft khi người dùng hỏi. Cả hai cùng cần một thứ: nội dung rõ ràng, đúng sự thật và trả lời thẳng câu hỏi của khách.
      </P>

      <H>Hệ thống đã tự làm sẵn (bạn không cần chạm vào)</H>
      <Bullets
        items={[
          'sitemap.xml, robots.txt, llms.txt và bản Markdown của từng trang: tự tạo từ nội dung, cập nhật mỗi khi bạn đăng bài.',
          'Dữ liệu cấu trúc (JSON-LD) cho Google: công ty, sản phẩm, bài viết, tác giả, FAQ, breadcrumb.',
          'Link chuẩn (canonical), ảnh chia sẻ mạng xã hội, hreflang tiếng Anh.',
          'Cho phép các bot AI uy tín đọc site (xem danh sách bên phải trang này).',
        ]}
      />

      <H>Bạn quyết định chất lượng ở 5 chỗ</H>
      <Steps
        items={[
          <>Nội dung bài viết trong {go('/admin/blog', 'Blog')}: đây là phần quan trọng nhất.</>,
          'Tiêu đề và mô tả tìm kiếm của từng trang (ngay trên trang này, nút Edit).',
          <>Tác giả thật có chức danh, ảnh, giới thiệu, LinkedIn trong {go('/admin/authors', 'Tác giả')}.</>,
          <>Case study có số liệu thật, có nguồn trong {go('/admin/use-cases', 'Case studies')}.</>,
          <>Mục FAQ trên bài viết và trên các trang trong {go('/admin/pages', 'Pages')}.</>,
        ]}
      />

      <H>Thói quen mỗi tuần (khoảng 1 giờ)</H>
      <Steps
        items={[
          'Liệt kê 3–5 câu khách hỏi nhiều nhất tuần qua (Sales, email, chat).',
          'Viết hoặc cập nhật 1 bài trả lời trọn vẹn một câu trong số đó.',
          'Chạy hết Checklist SEO/GEO trong trình soạn bài cho tới khi xanh.',
          'Thêm link từ bài mới tới trang sản phẩm liên quan và ngược lại.',
          'Cuối tháng xem tab "Đo kết quả" để biết bài nào hiệu quả, rồi viết tiếp chủ đề đó.',
        ]}
      />
      <Tip>SEO không có kết quả ngay: Google và AI cần thời gian để đọc lại và tin trang của bạn. Đều đặn và đúng sự thật quan trọng hơn viết thật nhiều.</Tip>
    </>
  )
}

function SeoTab() {
  const ownTitle = TITLE_MAX - SUFFIX.length
  return (
    <>
      <H>Tiêu đề tìm kiếm (dòng chữ xanh trên Google)</H>
      <Bullets
        items={[
          <>
            Tối đa <strong className="text-foreground">{TITLE_MAX} ký tự</strong>, đã tính phần "{SUFFIX.trim()}" hệ thống tự thêm, nên phần bạn viết
            khoảng {ownTitle} ký tự.
          </>,
          'Đặt cụm từ khách gõ tìm lên đầu tiêu đề, sau đó mới tới lợi ích.',
          'Mỗi trang một tiêu đề riêng, không trùng trang khác.',
        ]}
      />
      <Example
        good="Digital Signage CMS for Retail Chains"
        bad="Welcome to our amazing best-in-class platform"
        note="Câu đầu có đúng cụm khách tìm và nói rõ cho ai. Câu sau không chứa từ khoá nào và dùng từ quảng cáo."
      />

      <H>Mô tả tìm kiếm (dòng chữ xám bên dưới)</H>
      <Bullets
        items={[
          <>
            Từ 50 đến <strong className="text-foreground">{DESCRIPTION_MAX} ký tự</strong>. Viết như lời mời: trang này giúp gì, cho ai, và nên làm gì tiếp.
          </>,
          'Google đôi khi tự viết lại mô tả theo câu hỏi của người tìm; mô tả tốt vẫn giúp tăng lượt bấm.',
        ]}
      />
      <Example
        good="Upload, schedule and monitor content on every screen from one dashboard. See plans or book a demo."
        bad="Viewixsoft Viewixsoft CMS digital signage signage software screens screens"
        note="Câu đầu nói lợi ích và bước tiếp theo. Câu sau nhồi từ khoá; Google coi đó là spam."
      />

      <H>Mỗi bài, một chủ đề</H>
      <Bullets
        items={[
          'Chọn một câu hỏi chính cho mỗi bài và trả lời thật đầy đủ. Hai bài cùng nhắm một câu hỏi sẽ tự giành thứ hạng của nhau.',
          'Slug ngắn, tiếng Anh, chữ thường, nối bằng dấu gạch ngang, ví dụ what-is-digital-signage-cms.',
          'Không đổi slug của bài đã đăng: link cũ sẽ hỏng và bài mất thứ hạng. Nếu buộc phải đổi, nhờ dev thêm chuyển hướng 301.',
        ]}
      />

      <H>Cấu trúc bài viết</H>
      <Bullets
        items={[
          'Không dùng tiêu đề cấp 1 (#) trong nội dung: tiêu đề bài đã là H1. Dùng ## cho các phần chính, ### cho ý nhỏ, không nhảy cấp.',
          'Ít nhất 2 phần ## để Google hiểu bố cục.',
          'Mọi ảnh có mô tả (alt) nói ảnh đó cho thấy gì, ví dụ "Menu board showing breakfast prices in a café".',
          'Có ít nhất 1 link tới trang khác của Viewixsoft (sản phẩm, case study, bài liên quan).',
          'Ảnh thumbnail có alt; ảnh này cũng hiện khi chia sẻ lên mạng xã hội.',
        ]}
      />

      <H>Những việc nên tránh</H>
      <Bullets
        items={[
          'Nhồi từ khoá, chép nội dung từ site khác, hay dùng AI viết hàng loạt bài không ai kiểm tra.',
          'Từ quảng cáo không có dữ liệu chứng minh ("revolutionary", "best-in-class", "số 1").',
          'Ẩn chữ hoặc chèn chữ trùng màu nền.',
        ]}
      />
    </>
  )
}

function GeoTab() {
  return (
    <>
      <P>
        Trợ lý AI chọn trích dẫn những đoạn trả lời thẳng, có số liệu và có người chịu trách nhiệm. Viết sao cho một đoạn bất kỳ bị cắt ra vẫn
        đọc hiểu được.
      </P>

      <H>1. Trả lời trước, giải thích sau</H>
      <P>Mở đầu bài và mỗi phần ## bằng 1–2 câu trả lời thẳng câu hỏi (dưới 60 từ), rồi mới đi vào chi tiết.</P>
      <Example
        good="A digital signage CMS is software that lets you upload, schedule and update content on many screens from one dashboard."
        bad="In today's fast-paced world, businesses face many challenges when it comes to communication…"
        note="Câu đầu AI có thể trích nguyên văn. Câu sau phải đọc thêm vài đoạn mới thấy câu trả lời."
      />

      <H>2. Đặt tiêu đề phần dạng câu hỏi</H>
      <P>Dùng đúng câu khách hỏi AI, ví dụ "## How much does it cost to run 100 screens?" thay cho "## Pricing".</P>

      <H>3. Key takeaways và FAQ</H>
      <Bullets
        items={[
          'Điền ít nhất 3 ý trong Key takeaways: AI thường dùng phần này làm bản tóm tắt.',
          'Thêm 3–6 câu hỏi FAQ mà khách thật sự hỏi, mỗi câu trả lời 2–4 câu. Hệ thống tự gắn dữ liệu FAQ cho Google.',
        ]}
      />

      <H>4. Số liệu cụ thể, có nguồn, có ngày</H>
      <Bullets
        items={[
          'Ghi số đo được thay cho tính từ. Ví dụ về cách viết (không phải số liệu thật): "updated prices on 120 screens in 5 minutes" thay cho "fast".',
          'Mỗi con số ghi nguồn và thời điểm, ví dụ "(Viewixsoft customer data, March 2026)".',
          'Không có nguồn thì bỏ con số đó. Số liệu bịa làm mất uy tín với cả Google, AI và khách hàng.',
          'Bảng so sánh và các bước đánh số rất dễ được AI trích dẫn.',
        ]}
      />

      <H>5. Ai đứng sau nội dung</H>
      <Bullets
        items={[
          'Chọn tác giả thật cho mỗi bài, có chức danh, ảnh, đoạn giới thiệu kinh nghiệm và link LinkedIn.',
          'Cập nhật bài cũ khi thông tin thay đổi: ngày cập nhật trên bài sẽ đổi theo, AI và Google ưu tiên nội dung còn đúng.',
        ]}
      />

      <H>6. Gọi tên nhất quán</H>
      <P>
        Luôn viết đủ <strong className="text-foreground">Viewixsoft CMS</strong>, <strong className="text-foreground">Viewixsoft POS</strong>,{' '}
        <strong className="text-foreground">Viewixsoft Tracking</strong>, <strong className="text-foreground">Viewixsoft NFC</strong>. Không viết
        "Viewix CMS", "VX CMS" hay chữ thường: AI cần một cái tên duy nhất để nhận ra đó là cùng một sản phẩm.
      </P>
    </>
  )
}

const CHECKLIST = [
  'Bài trả lời một câu hỏi chính mà khách thật sự hỏi',
  `Tiêu đề tìm kiếm có từ khoá ở đầu, tổng không quá ${TITLE_MAX} ký tự`,
  `Mô tả tìm kiếm 50–${DESCRIPTION_MAX} ký tự, nói lợi ích và bước tiếp theo`,
  'Slug ngắn, tiếng Anh, không dấu',
  'Câu mở đầu trả lời thẳng câu hỏi (dưới 60 từ)',
  'Ít nhất 2 phần ##, có phần đặt dạng câu hỏi, không nhảy cấp tiêu đề',
  'Ít nhất 3 Key takeaways',
  '3–6 câu FAQ',
  'Mọi con số có nguồn và ngày; không có nguồn thì đã bỏ',
  'Thumbnail và mọi ảnh trong bài có alt',
  'Có link tới trang sản phẩm hoặc bài liên quan',
  'Đã chọn tác giả thật có giới thiệu',
  'Tên sản phẩm viết đủ "Viewixsoft …"',
  'Checklist SEO/GEO trong trình soạn bài đã xanh',
]

function ChecklistTab() {
  const [done, setDone] = useState<ReadonlySet<number>>(() => new Set())
  const toggle = (i: number) =>
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  return (
    <>
      <P>Đi qua danh sách này trước khi bấm "Đăng bài". Trình soạn blog cũng tự chấm điểm nhiều mục trong đây.</P>
      <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
        Đã xong {done.size}/{CHECKLIST.length}
      </p>
      <ul className="mt-2 space-y-1.5">
        {CHECKLIST.map((item, i) => (
          <li key={item}>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm has-[:checked]:border-success/40 has-[:checked]:bg-success/5">
              <input type="checkbox" checked={done.has(i)} onChange={() => toggle(i)} className="mt-0.5 size-4 shrink-0 accent-signal-500" />
              <span className={done.has(i) ? 'text-muted-foreground line-through decoration-1' : 'text-foreground'}>{item}</span>
            </label>
          </li>
        ))}
      </ul>
      {done.size > 0 && (
        <button type="button" onClick={() => setDone(new Set())} className={`${buttonSecondary} mt-3`}>
          Làm lại từ đầu
        </button>
      )}
    </>
  )
}

function MeasureTab() {
  return (
    <>
      <H>Google: dùng Google Search Console (miễn phí)</H>
      <Steps
        items={[
          'Vào search.google.com/search-console, thêm viewixsoft.com và xác minh quyền sở hữu (nhờ dev nếu cần thêm bản ghi DNS).',
          'Mục Sitemaps: gửi địa chỉ https://viewixsoft.com/sitemap.xml.',
          'Mục Performance: xem khách gõ gì để tìm thấy site, trang nào được bấm nhiều, vị trí trung bình.',
          'Mục URL Inspection: dán link bài mới để xin Google đọc sớm.',
        ]}
      />
      <Tip>Tìm các truy vấn có nhiều lượt hiển thị nhưng ít lượt bấm: thường chỉ cần viết lại tiêu đề và mô tả của trang đó cho rõ hơn.</Tip>

      <H>AI: tự kiểm tra mỗi tháng</H>
      <Steps
        items={[
          'Hỏi ChatGPT, Perplexity, Claude và Google (AI Overviews) đúng những câu bài của bạn trả lời, ví dụ "best digital signage software for restaurants".',
          'Ghi lại: Viewixsoft có được nhắc tên không, có link về site không, thông tin có đúng không.',
          'Nếu AI nói sai, sửa hoặc bổ sung nội dung trên site cho rõ; AI sẽ cập nhật khi đọc lại.',
          'Trong công cụ analytics (nếu đã cài), xem lượt truy cập đến từ chatgpt.com, perplexity.ai, claude.ai, gemini.google.com.',
        ]}
      />

      <H>Đọc nhật ký</H>
      <P>Trang Nhật ký hoạt động cho biết ai đã sửa tiêu đề, mô tả hay đăng bài lúc nào, để đối chiếu khi thứ hạng thay đổi.</P>
    </>
  )
}

/** "How to use this page" guide for SEO & GEO, opened from the page header. */
export function SeoGuide() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<TabValue>('start')
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonSecondary}>
        <BookOpenText aria-hidden="true" className="size-4" /> Hướng dẫn SEO &amp; GEO
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-2xl">
          <SheetHeader className="sticky top-0 z-10 space-y-3 border-b border-border bg-background p-6 pr-12">
            <SheetTitle>Hướng dẫn tăng hiệu quả trên Google và AI</SheetTitle>
            <SheetDescription>Làm gì, ở đâu trong admin, và cách biết nó có hiệu quả.</SheetDescription>
            <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
              <TabsList aria-label="Phần hướng dẫn">
                {TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value}>
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </SheetHeader>
          <div role="tabpanel" aria-label={TABS.find((t) => t.value === tab)?.label} className="p-6">
            {tab === 'start' && <StartTab onNavigate={() => setOpen(false)} />}
            {tab === 'seo' && <SeoTab />}
            {tab === 'geo' && <GeoTab />}
            {tab === 'checklist' && <ChecklistTab />}
            {tab === 'measure' && <MeasureTab />}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
