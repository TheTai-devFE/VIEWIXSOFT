import {
  BarChart3,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Mail,
  Package,
  PanelsTopLeft,
  Quote,
  Search,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface AdminNavItem {
  to:
    | '/admin'
    | '/admin/leads'
    | '/admin/subscribers'
    | '/admin/pages'
    | '/admin/seo'
    | '/admin/products'
    | '/admin/stats'
    | '/admin/testimonials'
    | '/admin/media'
  label: string
  icon: LucideIcon
  /** Rendered as the collapsible list of every page instead of a single link. */
  tree?: 'pages'
}

/** Sidebar modules, grouped. Order here is the order in the sidebar. */
export const ADMIN_NAV: { group: string; items: AdminNavItem[] }[] = [
  { group: 'Overview', items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    group: 'Sales',
    items: [
      { to: '/admin/leads', label: 'Leads', icon: Inbox },
      { to: '/admin/subscribers', label: 'Subscribers', icon: Mail },
    ],
  },
  {
    group: 'Website',
    items: [
      { to: '/admin/pages', label: 'Pages', icon: PanelsTopLeft, tree: 'pages' },
      { to: '/admin/seo', label: 'SEO & GEO', icon: Search },
      { to: '/admin/products', label: 'Product status', icon: Package },
      { to: '/admin/stats', label: 'Company stats', icon: BarChart3 },
      { to: '/admin/testimonials', label: 'Customer quotes', icon: Quote },
    ],
  },
  { group: 'Media', items: [{ to: '/admin/media', label: 'Images & videos', icon: ImageIcon }] },
]
