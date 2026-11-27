import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Award,
  Users,
  Layers,
  GalleryHorizontalEnd,
  Images,
  ChartColumn,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface AdminNavItem {
  label: string
  /** Path relative to /admin ('' = dashboard). */
  path: string
  icon: LucideIcon
}

export const ADMIN_BASE = '/admin'

export const ADMIN_NAV: AdminNavItem[] = [
  { label: 'Dashboard', path: '', icon: LayoutDashboard },
  { label: 'Orders', path: 'orders', icon: ShoppingBag },
  { label: 'Products', path: 'products', icon: Package },
  { label: 'Badges', path: 'badges', icon: Award },
  { label: 'Users', path: 'users', icon: Users },
  { label: 'Categories', path: 'categories', icon: Layers },
  { label: 'Hero Banners', path: 'hero-banners', icon: GalleryHorizontalEnd },
  { label: 'Sub Banners', path: 'sub-banners', icon: Images },
  { label: 'Sales Reports', path: 'sales-reports', icon: ChartColumn },
]

export function adminPath(path: string): string {
  return path ? `${ADMIN_BASE}/${path}` : ADMIN_BASE
}
