import type { Order } from '../../shared/types/order'
import { listNewOrders } from './orderAdminService'

/**
 * New-order notifications with per-order read/unread tracking.
 *
 * - "New" orders come from orderAdminService.listNewOrders() (status
 *   Processing — there is no unread flag in the order data).
 * - Read state is tracked by ORDER ID in a separate set, so marking an order
 *   as read never touches the order record, its payment or fulfilment status.
 * - The set is persisted in localStorage under an admin-only key (not used by
 *   the storefront), so read orders stay read after a page reload.
 *
 * Backend integration: replace the two storage functions below (and keep
 * listUnreadOrders / markOrdersRead as the interface) once an API exists.
 */

const STORAGE_KEY = 's90_admin_read_order_ids'

function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [])
  } catch {
    return new Set()
  }
}

function saveReadIds(ids: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)))
  } catch {
    // Storage unavailable (private mode / quota): read state stays in memory.
  }
}

const readIds = loadReadIds()

/** New orders the admin has not seen yet (de-duplicated by order ID). */
export function listUnreadOrders(): Order[] {
  return listNewOrders().filter((o) => !readIds.has(o.id))
}

/**
 * Marks the given orders as read. Returns true when anything changed, so
 * callers only trigger a re-render when needed.
 */
export function markOrdersRead(orderIds: string[]): boolean {
  let changed = false
  for (const id of orderIds) {
    if (!readIds.has(id)) {
      readIds.add(id)
      changed = true
    }
  }
  if (changed) saveReadIds(readIds)
  return changed
}
