import type { Product } from '../types/product'
import { JERSEY_OPTION_PRICES } from '../../user/constants/jerseyOptions'

/**
 * Per-product purchase options set in Admin › Products, read by the product
 * page, the cart flow and Admin › Orders › Manual Order.
 *
 * - Sizes: `availableSizes` lists the sizes offered; a size whose variant has
 *   `inStock: false` is shown but cannot be selected (the same rule the
 *   Quick Add modal and product cards already use). Stock is unlimited.
 * - Name & number personalisation: the jersey's `customization` flags.
 * - Shorts: the jersey's `shorts` setting; unset keeps the standard offer.
 */

export function isSizeAvailable(product: Product, size: string | number): boolean {
  return !product.variants.some((v) => String(v.size) === String(size) && v.inStock === false)
}

/** Offered sizes a customer can choose (as strings). */
export function selectableSizes(product: Product): string[] {
  return (product.availableSizes as (string | number)[]).map(String).filter((s) => isSizeAvailable(product, s))
}

export function allowsNameNumber(product: Product): boolean {
  return product.productType === 'jersey' && Boolean(product.customization?.customNameAllowed || product.customization?.customNumberAllowed)
}

/** The shorts add-on for a jersey, or null when it isn't offered. */
export function shortsOptionFor(product: Product): { price: number } | null {
  if (product.productType !== 'jersey') return null
  if (!product.shorts) return { price: JERSEY_OPTION_PRICES.shorts }
  return product.shorts.enabled ? { price: product.shorts.price } : null
}
