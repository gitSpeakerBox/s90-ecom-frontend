import { DUMMY_ORDERS } from '../../shared/data/orders'
import type { Order, OrderStatus } from '../../shared/types/order'
import type { PaymentStatus } from '../types/admin'
import { ORDER_STATUSES } from '../utils/status'

/**
 * Admin adapter over the existing demo orders (src/shared/data/orders.ts).
 * Status updates are applied to the same objects the customer "Track Order"
 * pages read, so they are visible there for the rest of the session.
 */

export function listOrders(): Order[] {
  return DUMMY_ORDERS
}

export function sortByDateDesc(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id.localeCompare(a.id)))
}

/**
 * Status that marks an order as "new": placed but not yet actioned by the
 * store. The order data has no unread/seen flag, so newness is derived from
 * the existing status field — an order stops being new once it is packed.
 */
export const NEW_ORDER_STATUS: OrderStatus = 'Processing'

/**
 * Single source for the new-order notification (sidebar + Orders page).
 * Derived from the live order list on every call and de-duplicated by order
 * ID, so an order is never counted twice.
 */
export function listNewOrders(): Order[] {
  const byId = new Map<string, Order>()
  for (const o of DUMMY_ORDERS) {
    if (o.status === NEW_ORDER_STATUS && !byId.has(o.id)) byId.set(o.id, o)
  }
  return sortByDateDesc(Array.from(byId.values()))
}

export function earliestOrderDate(): string | undefined {
  return DUMMY_ORDERS.reduce<string | undefined>((min, o) => (!min || o.date < min ? o.date : min), undefined)
}

/**
 * Derived — the order records have no payment-status field. Cash on Delivery
 * is treated as unpaid until delivery; every other method as paid at checkout.
 */
export function getPaymentStatus(order: Order): PaymentStatus {
  const cod = /cash on delivery/i.test(order.paymentMethod)
  return cod && order.status !== 'Delivered' ? 'Unpaid (COD)' : 'Paid'
}

export function orderUnits(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.quantity, 0)
}

export function isOpenOrder(order: Order): boolean {
  return order.status !== 'Delivered'
}

const stampDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
const stampTime = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' })

/** Moves an order to a new fulfilment status and rebuilds its timeline flags. */
export function updateOrderStatus(order: Order, status: OrderStatus): void {
  const target = ORDER_STATUSES.indexOf(status)
  const now = new Date()
  order.status = status
  order.timeline = order.timeline.map((step) => {
    const idx = ORDER_STATUSES.indexOf(step.status)
    if (idx <= target) {
      return {
        ...step,
        completed: true,
        isCurrent: idx === target,
        date: step.date ?? stampDate.format(now),
        time: step.time ?? stampTime.format(now),
      }
    }
    return { ...step, completed: false, isCurrent: false, date: undefined, time: undefined }
  })
}
