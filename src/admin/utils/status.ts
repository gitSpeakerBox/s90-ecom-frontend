import type { OrderStatus } from '../../shared/types/order'
import type { OrderStatusMap } from '../types/admin'

/** Fulfilment pipeline in order. Mirrors the OrderStatus union. */
export const ORDER_STATUSES: OrderStatus[] = [
  'Processing',
  'Packed',
  'Shipped',
  'Out for delivery',
  'Delivered',
]

/**
 * Status colours are categorical slots validated together in this order
 * (adjacent-pair colour-vision-deficiency separation passes); Delivered is green.
 */
export const ORDER_STATUS_META: OrderStatusMap = {
  Processing: { label: 'Processing', tone: 'warning', color: '#eda100' },
  Packed: { label: 'Packed', tone: 'violet', color: '#6250d6' },
  Shipped: { label: 'Shipped', tone: 'orange', color: '#eb6834' },
  'Out for delivery': { label: 'Out for delivery', tone: 'info', color: '#2a78d6' },
  Delivered: { label: 'Delivered', tone: 'success', color: '#008300' },
}

/** Series colours for the two product lines (validated pair). */
export const TYPE_COLORS = { jerseys: '#2a78d6', shoes: '#eb6834' } as const
