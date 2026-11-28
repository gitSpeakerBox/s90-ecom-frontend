export type OrderStatus =
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Out for delivery'
  | 'Delivered'

export interface OrderItem {
  productSlug: string
  productName: string
  productImage: string
  size: string
  quantity: number
  price: number
  category: 'jerseys' | 'shoes'
  /** Jersey options chosen for this line (orders created in Admin › Manual Order). `price` already includes them. */
  customization?: OrderItemCustomization
}

export interface OrderItemCustomization {
  version: 'stadium' | 'authentic'
  shorts: boolean
  /** Normal Badges (Admin › Badges), by name. */
  badges: string[]
  /** Sponsor Badges (Admin › Badges), by name. */
  sponsorBadges: string[]
}

export interface ShippingAddress {
  fullName: string
  street: string
  city: string
  country: string
  postalCode?: string
  phone?: string
  /** Region / state / municipality. */
  region?: string
}

export interface OrderTimelineStep {
  status: OrderStatus
  titleKey: string
  date?: string
  time?: string
  completed: boolean
  isCurrent: boolean
}

export interface Order {
  id: string
  date: string
  status: OrderStatus
  paymentMethod: string
  shippingAddress: ShippingAddress
  currency: string
  subtotal: number
  shippingFee: number
  /** Coupon discount, when one was applied. total = subtotal − discount + shippingFee. */
  discount?: number
  couponCode?: string
  /** Customer email, when recorded on the order. */
  customerEmail?: string
  /** 'admin-manual' for orders created in Admin › Orders › Manual Order. */
  source?: 'admin-manual'
  total: number
  items: OrderItem[]
  timeline: OrderTimelineStep[]
}

