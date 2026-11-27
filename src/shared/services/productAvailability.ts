/**
 * Product-level availability (block / unblock).
 *
 * A blocked product is hidden from every customer-facing product query
 * (listings, collections, search, related products, detail URLs) and cannot
 * be added to or bought from the cart. Admin views still see it.
 *
 * Storage: blocked product IDs are kept in a separate set — product records
 * are not modified. Because this project has no backend, the set is
 * persisted in localStorage so a block survives reloads and direct URL
 * visits in this browser, and is synced across tabs via the `storage` event.
 * It does not reach other browsers/devices: replace load/save with an API
 * once a backend exists (the exported functions are the integration seam).
 */

import type { Product } from '../types/product'

const STORAGE_KEY = 's90_blocked_product_ids'

type Listener = () => void
const listeners = new Set<Listener>()
let version = 0

function load(): Set<string> {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [])
  } catch {
    return new Set()
  }
}

function save(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(blockedIds)))
  } catch {
    // Storage unavailable: the block still applies for this session.
  }
}

function notify(): void {
  version++
  listeners.forEach((l) => l())
}

let blockedIds = load()

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      blockedIds = load()
      notify()
    }
  })
}

export function isProductBlocked(product: Pick<Product, 'id'>): boolean {
  return blockedIds.has(product.id)
}

/** True when customers may see and buy the product. */
export function isProductAvailable(product: Pick<Product, 'id'>): boolean {
  return !blockedIds.has(product.id)
}

export function setProductBlocked(productId: string, blocked: boolean): void {
  const has = blockedIds.has(productId)
  if (blocked === has) return
  if (blocked) blockedIds.add(productId)
  else blockedIds.delete(productId)
  save()
  notify()
}

/** For React's useSyncExternalStore: re-render when availability changes. */
export function subscribeProductAvailability(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getProductAvailabilityVersion(): number {
  return version
}
