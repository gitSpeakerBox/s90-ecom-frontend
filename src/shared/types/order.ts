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
}

export interface ShippingAddress {
  fullName: string
  street: string
  city: string
  country: string
  postalCode?: string
  phone?: string
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
  total: number
  items: OrderItem[]
  timeline: OrderTimelineStep[]
}

