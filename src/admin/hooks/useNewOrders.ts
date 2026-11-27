import { useEffect } from 'react'
import { useAdminData } from '../context/AdminDataContext'
import { listUnreadOrders, markOrdersRead } from '../services/orderNotificationService'
import type { Order } from '../../shared/types/order'

/**
 * Shared unread new-order notification state for the sidebar badge and the
 * Orders page bell. Both read the same list from the same service and
 * re-render on every admin data change, so their counts always match.
 */
export function useNewOrders(): Order[] {
  useAdminData() // subscribe to order / notification changes
  return listUnreadOrders()
}

/**
 * Marks every currently unread new order as read when the calling page is
 * opened. Orders that become new while the page is already open stay unread
 * (and visible in both badges) until the page is next opened.
 */
export function useMarkNewOrdersReadOnOpen(): void {
  const { commit } = useAdminData()
  useEffect(() => {
    const ids = listUnreadOrders().map((o) => o.id)
    if (ids.length === 0) return
    // Re-render both badges once the IDs are recorded as read.
    commit(() => {
      markOrdersRead(ids)
    })
  }, [commit])
}
