import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  BookOpen,
  Braces,
  Briefcase,
  History,
  Image as ImageIcon,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Mail,
  Package,
  PanelBottom,
  PanelsTopLeft,
  Quote,
  Search,
  UserCog,
  UserPen,
  Users,
} from 'lucide-react'
import type { Access, Permission } from '~/lib/permissions'
import { can } from '~/lib/permissions'

export interface AdminNavItem {
  to:
    | '/admin'
    | '/admin/leads'
    | '/admin/subscribers'
    | '/admin/blog'
    | '/admin/use-cases'
    | '/admin/authors'
    | '/admin/pages'
    | '/admin/footer'
    | '/admin/seo'
    | '/admin/schema'
    | '/admin/api-keys'
    | '/admin/products'
    | '/admin/stats'
    | '/admin/testimonials'
    | '/admin/media'
    | '/admin/users'
    | '/admin/activity'
    | '/admin/account'
  label: string
  icon: LucideIcon
  /** Who may open it: a module permission, admins only, or every signed-in account. */
  access: Permission | 'admin' | 'everyone'
  /** Rendered as the collapsible list of every page instead of a single link. */
  tree?: 'pages'
}

/** Sidebar modules, grouped. Order here is the order in the sidebar. */
export const ADMIN_NAV: { group: string; items: AdminNavItem[] }[] = [
  { group: 'Overview', items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, access: 'dashboard' }] },
  {
    group: 'Sales',
    items: [
      { to: '/admin/leads', label: 'Leads', icon: Inbox, access: 'leads' },
      { to: '/admin/subscribers', label: 'Subscribers', icon: Mail, access: 'subscribers' },
    ],
  },
  {
    group: 'Content',
    items: [
      { to: '/admin/blog', label: 'Blog posts', icon: BookOpen, access: 'blog' },
      { to: '/admin/use-cases', label: 'Case studies', icon: Briefcase, access: 'use-cases' },
      { to: '/admin/authors', label: 'Authors', icon: UserPen, access: 'authors' },
    ],
  },
  {
    group: 'Website',
    items: [
      { to: '/admin/pages', label: 'Pages', icon: PanelsTopLeft, access: 'pages', tree: 'pages' },
      { to: '/admin/footer', label: 'Footer info', icon: PanelBottom, access: 'footer' },
      { to: '/admin/seo', label: 'SEO & GEO', icon: Search, access: 'seo' },
      { to: '/admin/schema', label: 'Schema markup', icon: Braces, access: 'schema' },
      { to: '/admin/products', label: 'Product status', icon: Package, access: 'products' },
      { to: '/admin/stats', label: 'Company stats', icon: BarChart3, access: 'stats' },
      { to: '/admin/testimonials', label: 'Customer quotes', icon: Quote, access: 'testimonials' },
    ],
  },
  { group: 'Media', items: [{ to: '/admin/media', label: 'Images & videos', icon: ImageIcon, access: 'media' }] },
  {
    group: 'Tài khoản',
    items: [
      { to: '/admin/users', label: 'Người dùng & quyền', icon: Users, access: 'admin' },
      { to: '/admin/api-keys', label: 'Khóa API', icon: KeyRound, access: 'api-keys' },
      { to: '/admin/activity', label: 'Nhật ký hoạt động', icon: History, access: 'activity' },
      { to: '/admin/account', label: 'Tài khoản của tôi', icon: UserCog, access: 'everyone' },
    ],
  },
]


export function canOpen(access: Access, item: Pick<AdminNavItem, 'access'>) {
  if (item.access === 'everyone') return true
  if (item.access === 'admin') return access.role === 'admin'
  return can(access, item.access)
}

/** The sidebar for one account: only modules it may open, and no empty groups. */
export function navFor(access: Access) {
  return ADMIN_NAV.map((g) => ({ ...g, items: g.items.filter((i) => canOpen(access, i)) })).filter((g) => g.items.length)
}

/** The nav item an admin path belongs to (`/admin/blog/123` → Blog posts), or undefined. */
export function navItemFor(pathname: string) {
  const path = pathname.replace(/\/+$/, '') || '/admin'
  return ADMIN_NAV.flatMap((g) => g.items).find((i) =>
    i.to === '/admin' ? path === '/admin' : path === i.to || path.startsWith(`${i.to}/`),
  )
}

/** Where an account lands when it opens a page it may not use: its first allowed module. */
export function homeFor(access: Access): AdminNavItem['to'] {
  return navFor(access)[0]?.items[0]?.to ?? '/admin/account'
}
