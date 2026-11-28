/**
 * Cart and shipping constants.
 * Single source of truth for free shipping threshold, standard shipping fees, and demo coupons.
 */

export const FREE_SHIPPING_THRESHOLD = 250
export const STANDARD_SHIPPING_FEE = 20

export interface CouponDefinition {
  code: string
  discountPercent: number
  description?: string
}

export interface CartTotals {
  subtotal: number
  discountAmount: number
  shippingCost: number
  /** Subtotal − discount + shipping (never negative). */
  finalTotal: number
  isFreeShipping: boolean
}

/**
 * Order totals rule shared by the cart / checkout and Admin › Manual Order:
 * free shipping from FREE_SHIPPING_THRESHOLD (on the subtotal before discount),
 * otherwise STANDARD_SHIPPING_FEE; a coupon takes its percentage off the subtotal.
 */
export function calculateCartTotals(
  lines: { price: number; quantity?: number }[],
  coupon: CouponDefinition | null
): CartTotals {
  const subtotal = lines.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0)
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD
  const shippingCost = lines.length === 0 || isFreeShipping ? 0 : STANDARD_SHIPPING_FEE
  const discountAmount = coupon ? Math.round(((subtotal * coupon.discountPercent) / 100) * 100) / 100 : 0
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingCost)
  return { subtotal, discountAmount, shippingCost, finalTotal, isFreeShipping }
}

// Client-supported promotional coupons for UI preview & testing
export const DEMO_COUPONS: Record<string, CouponDefinition> = {
  S90SPORT: { code: 'S90SPORT', discountPercent: 10, description: '10% off entire order' },
  WELCOME10: { code: 'WELCOME10', discountPercent: 10, description: '10% first order' },
  SAVE10: { code: 'SAVE10', discountPercent: 10, description: '10% promotional discount' },
  S90VIP: { code: 'S90VIP', discountPercent: 15, description: '15% VIP discount' },
}
