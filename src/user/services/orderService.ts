import type { Order } from '../../shared/types/order'
import { DUMMY_ORDERS } from '../../shared/data/orders'
import { findProductBySlug } from './productService'

/**
 * Hydrate orders with catalog product details if missing.
 */
function hydrateOrder(order: Order): Order {
  const updatedItems = order.items.map((item) => {
    const product = findProductBySlug(item.productSlug)
    return {
      ...item,
      productName: item.productName || product?.name || item.productSlug,
      productImage: item.productImage || product?.images?.[0] || '/images/products/jerseys/jersey1.png',
      category: item.category || (product?.productType === 'shoe' ? 'shoes' : 'jerseys'),
    }
  })

  return {
    ...order,
    items: updatedItems,
  }
}

/**
 * Fetch all orders. Returns a Promise so a real API backend can seamlessly replace it later.
 */
export async function getOrders(): Promise<Order[]> {
  // Simulate slight asynchronous resolution typical of API calls
  return Promise.resolve(DUMMY_ORDERS.map(hydrateOrder))
}

/**
 * Fetch a single order by ID (e.g. 'S90-100245'). Case-insensitive.
 */
export async function getOrderById(id: string): Promise<Order | null> {
  if (!id) return Promise.resolve(null)
  const trimmed = id.trim().toLowerCase()
  const found = DUMMY_ORDERS.find(
    (order) => order.id.toLowerCase() === trimmed
  )
  return Promise.resolve(found ? hydrateOrder(found) : null)
}


/**
 * Saves a new order to the order store (currently the in-memory demo orders:
 * there is no backend yet, so the order lasts until the page is reloaded).
 * Async like the other functions, so a real API can replace it.
 */
export async function createOrder(order: Order): Promise<Order> {
  if (DUMMY_ORDERS.some((o) => o.id.toLowerCase() === order.id.toLowerCase())) {
    throw new Error(`Order ${order.id} already exists.`)
  }
  DUMMY_ORDERS.unshift(order)
  return Promise.resolve(order)
}
