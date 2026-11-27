import type { OrderStatus } from '../../shared/types/order'

/** Date-range presets offered by admin filters. */
export type DatePreset = 'today' | '7d' | '30d' | '90d' | '12m' | 'all' | 'custom'

/** Inclusive calendar range (start at 00:00, end at 23:59:59.999 local time). */
export interface DateRange {
  start: Date
  end: Date
}

export type Granularity = 'day' | 'month'

/**
 * Payment status is NOT stored on the order records; it is derived from the
 * payment method (cash on delivery is unpaid until the order is delivered).
 */
export type PaymentStatus = 'Paid' | 'Unpaid (COD)'

/** Visual tone shared by badges and status indicators. */
export type Tone = 'neutral' | 'success' | 'info' | 'warning' | 'violet' | 'orange' | 'danger'

export interface StatusMeta {
  label: string
  tone: Tone
  /** Chart colour for this status (validated categorical slot). */
  color: string
}

export type OrderStatusMap = Record<OrderStatus, StatusMeta>

export interface SeriesPoint {
  key: string
  label: string
  revenue: number
  orders: number
  jerseys: number
  shoes: number
}

export interface SalesSummary {
  revenue: number
  orders: number
  units: number
  averageOrderValue: number
  itemsPerOrder: number
  jerseyRevenue: number
  shoeRevenue: number
}

export interface ProductSalesRow {
  slug: string
  name: string
  image: string
  type: 'jerseys' | 'shoes'
  category: string
  units: number
  revenue: number
  orders: number
}

export interface CategorySalesRow {
  category: string
  type: 'jerseys' | 'shoes'
  units: number
  revenue: number
  share: number
}

export interface DailySalesRow {
  date: string
  orders: number
  units: number
  revenue: number
}
