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

// Client-supported promotional coupons for UI preview & testing
export const DEMO_COUPONS: Record<string, CouponDefinition> = {
  S90SPORT: { code: 'S90SPORT', discountPercent: 10, description: '10% off entire order' },
  WELCOME10: { code: 'WELCOME10', discountPercent: 10, description: '10% first order' },
  SAVE10: { code: 'SAVE10', discountPercent: 10, description: '10% promotional discount' },
  S90VIP: { code: 'S90VIP', discountPercent: 15, description: '15% VIP discount' },
}
