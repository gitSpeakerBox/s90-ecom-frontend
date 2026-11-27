import type { Order, OrderStatus } from '../../shared/types/order'
import { getProductBySlug } from '../../shared/data/products'
import type {
  CategorySalesRow,
  DailySalesRow,
  DateRange,
  Granularity,
  ProductSalesRow,
  SalesSummary,
  SeriesPoint,
} from '../types/admin'
import { isInRange } from '../utils/dateRange'
import { formatMonth, formatShortDate, parseISODate, toISODate } from '../utils/format'
import { ORDER_STATUSES } from '../utils/status'

/**
 * Every figure here is calculated from the demo orders in
 * src/shared/data/orders.ts — not from real transactions.
 * Revenue = order total (subtotal + shipping). Product/category revenue is
 * line price × quantity (shipping is not allocated to lines).
 */

export function ordersInRange(orders: Order[], range: DateRange): Order[] {
  return orders.filter((o) => isInRange(o.date, range))
}

function lineRevenue(order: Order, type?: 'jerseys' | 'shoes'): number {
  return order.items
    .filter((i) => !type || i.category === type)
    .reduce((s, i) => s + i.price * i.quantity, 0)
}

export function summarize(orders: Order[]): SalesSummary {
  const revenue = orders.reduce((s, o) => s + o.total, 0)
  const units = orders.reduce((s, o) => s + o.items.reduce((u, i) => u + i.quantity, 0), 0)
  const count = orders.length
  return {
    revenue,
    orders: count,
    units,
    averageOrderValue: count ? revenue / count : 0,
    itemsPerOrder: count ? units / count : 0,
    jerseyRevenue: orders.reduce((s, o) => s + lineRevenue(o, 'jerseys'), 0),
    shoeRevenue: orders.reduce((s, o) => s + lineRevenue(o, 'shoes'), 0),
  }
}

function bucketKey(date: Date, g: Granularity): string {
  return g === 'day' ? toISODate(date) : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** Continuous time series with zero-filled buckets across the whole range. */
export function timeSeries(orders: Order[], range: DateRange, g: Granularity): SeriesPoint[] {
  const points = new Map<string, SeriesPoint>()
  const cursor = new Date(range.start.getFullYear(), range.start.getMonth(), g === 'day' ? range.start.getDate() : 1)
  while (cursor <= range.end) {
    const key = bucketKey(cursor, g)
    points.set(key, {
      key,
      label: g === 'day' ? formatShortDate(cursor) : formatMonth(cursor),
      revenue: 0,
      orders: 0,
      jerseys: 0,
      shoes: 0,
    })
    if (g === 'day') cursor.setDate(cursor.getDate() + 1)
    else cursor.setMonth(cursor.getMonth() + 1)
  }
  for (const o of ordersInRange(orders, range)) {
    const p = points.get(bucketKey(parseISODate(o.date), g))
    if (!p) continue
    p.revenue += o.total
    p.orders += 1
    p.jerseys += lineRevenue(o, 'jerseys')
    p.shoes += lineRevenue(o, 'shoes')
  }
  return Array.from(points.values())
}

export function statusBreakdown(orders: Order[]): { status: OrderStatus; count: number }[] {
  return ORDER_STATUSES.map((status) => ({
    status,
    count: orders.filter((o) => o.status === status).length,
  }))
}

export function productSales(orders: Order[]): ProductSalesRow[] {
  const rows = new Map<string, ProductSalesRow>()
  for (const o of orders) {
    const seen = new Set<string>()
    for (const item of o.items) {
      const product = getProductBySlug(item.productSlug)
      let row = rows.get(item.productSlug)
      if (!row) {
        row = {
          slug: item.productSlug,
          name: product?.name ?? item.productName,
          image: product?.images[0] ?? item.productImage,
          type: item.category,
          category: product?.category ?? (item.category === 'jerseys' ? 'Jerseys (not in catalog)' : 'Shoes (not in catalog)'),
          units: 0,
          revenue: 0,
          orders: 0,
        }
        rows.set(item.productSlug, row)
      }
      row.units += item.quantity
      row.revenue += item.price * item.quantity
      if (!seen.has(item.productSlug)) {
        row.orders += 1
        seen.add(item.productSlug)
      }
    }
  }
  return Array.from(rows.values()).sort((a, b) => b.revenue - a.revenue || b.units - a.units)
}

export function categorySales(orders: Order[]): CategorySalesRow[] {
  const rows = new Map<string, CategorySalesRow>()
  let total = 0
  for (const p of productSales(orders)) {
    let row = rows.get(p.category)
    if (!row) {
      row = { category: p.category, type: p.type, units: 0, revenue: 0, share: 0 }
      rows.set(p.category, row)
    }
    row.units += p.units
    row.revenue += p.revenue
    total += p.revenue
  }
  return Array.from(rows.values())
    .map((r) => ({ ...r, share: total ? r.revenue / total : 0 }))
    .sort((a, b) => b.revenue - a.revenue)
}

/** One row per calendar date that has orders, newest first. */
export function dailySales(orders: Order[]): DailySalesRow[] {
  const rows = new Map<string, DailySalesRow>()
  for (const o of orders) {
    const row = rows.get(o.date) ?? { date: o.date, orders: 0, units: 0, revenue: 0 }
    row.orders += 1
    row.units += o.items.reduce((u, i) => u + i.quantity, 0)
    row.revenue += o.total
    rows.set(o.date, row)
  }
  return Array.from(rows.values()).sort((a, b) => (a.date < b.date ? 1 : -1))
}
