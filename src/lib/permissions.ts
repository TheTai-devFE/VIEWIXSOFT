import { z } from 'zod'

/**
 * Admin access. An `admin` can do everything, including managing accounts.
 * A `user` (shown as "Thành viên") can only use the modules ticked for them.
 * Shared by the sidebar, the route guards and the server functions, so the
 * three can't drift apart.
 */
export const ROLES = ['admin', 'user'] as const
export type Role = (typeof ROLES)[number]

export const PERMISSIONS = [
  'dashboard',
  'leads',
  'subscribers',
  'blog',
  'use-cases',
  'edit-others',
  'authors',
  'pages',
  'footer',
  'seo',
  'schema',
  'products',
  'stats',
  'testimonials',
  'media',
  'activity',
] as const
export type Permission = (typeof PERMISSIONS)[number]

export const PermissionSchema = z.enum(PERMISSIONS)

export const PERMISSION_LABELS: Record<Permission, { label: string; hint: string }> = {
  dashboard: { label: 'Dashboard', hint: 'Số liệu tổng quan' },
  leads: { label: 'Leads', hint: 'Xem và cập nhật khách hàng tiềm năng, xoá dữ liệu theo yêu cầu' },
  subscribers: { label: 'Subscribers', hint: 'Danh sách đăng ký newsletter' },
  blog: { label: 'Blog posts', hint: 'Viết, sửa, đăng và xoá bài blog' },
  'use-cases': { label: 'Case studies', hint: 'Viết, sửa, đăng và xoá case study' },
  'edit-others': { label: 'Sửa bài của người khác', hint: 'Sửa, đăng/gỡ và xoá blog, case study do người khác tạo' },
  authors: { label: 'Tác giả', hint: 'Thêm và sửa hồ sơ tác giả' },
  pages: { label: 'Pages', hint: 'Sửa nội dung và ẩn/hiện các trang' },
  footer: { label: 'Footer info', hint: 'Thông tin chân trang' },
  seo: { label: 'SEO & GEO', hint: 'Tiêu đề và mô tả tìm kiếm của từng trang' },
  schema: { label: 'Schema markup', hint: 'Thêm, sửa và duyệt schema của từng trang (kể cả schema do tool gửi qua API)' },
  products: { label: 'Product status', hint: 'Trạng thái sản phẩm' },
  stats: { label: 'Company stats', hint: 'Số liệu công ty' },
  testimonials: { label: 'Customer quotes', hint: 'Trích dẫn khách hàng' },
  media: { label: 'Ảnh & video', hint: 'Quản lý thư viện: tải lên, xoá, gán ảnh' },
  activity: { label: 'Nhật ký hoạt động', hint: 'Xem ai đã làm gì trong admin (90 ngày gần nhất)' },
}

/** One-click starting points in the account form; the ticks can still be changed after. */
export const PERMISSION_PRESETS: { label: string; permissions: Permission[] }[] = [
  { label: 'Marketing', permissions: ['blog', 'use-cases', 'authors', 'media'] },
]

/** Editors that pick or upload images in place, so they can reach the library without the media module. */
export const UPLOAD_PERMISSIONS = ['media', 'blog', 'use-cases', 'authors', 'pages'] as const satisfies readonly Permission[]

export interface Access {
  role: Role
  permissions: readonly Permission[]
}

/** True when the account may use at least one of `needed`. */
export function can(access: Access, ...needed: Permission[]) {
  if (access.role === 'admin') return true
  return needed.some((p) => access.permissions.includes(p))
}

/** Drops unknown values, e.g. a permission removed from the list after it was saved. */
export function parsePermissions(value: unknown): Permission[] {
  if (!Array.isArray(value)) return []
  return PERMISSIONS.filter((p) => value.includes(p))
}

export function parseRole(value: unknown): Role {
  return value === 'admin' ? 'admin' : 'user'
}

/**
 * Blog posts and case studies: anyone with the module can read every one, but
 * only its creator, admins and holders of 'edit-others' may change or delete it.
 */
export function canEditContent(access: Access & { userId: string }, item: { createdBy: string | null }) {
  return can(access, 'edit-others') || (item.createdBy !== null && item.createdBy === access.userId)
}
