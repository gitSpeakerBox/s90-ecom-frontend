import { allProducts } from '../../shared/data/products'
import { DUMMY_ORDERS } from '../../shared/data/orders'
import { COUNTRIES } from '../../shared/data/countries'
import type { Product } from '../../shared/types/product'
import type { Order, OrderItem, OrderItemCustomization, OrderStatus } from '../../shared/types/order'
import { isProductBlocked } from '../../shared/services/productAvailability'
import { getBadgeById, visibleBadgesFor, visibleSponsorsFor } from '../../shared/services/badgeService'
import { validateEmail, validatePhoneNumber } from '../../shared/utils/authValidation'
import { BASE_CURRENCY } from '../../shared/constants/currency'
import { JERSEY_OPTION_PRICES } from '../../user/constants/jerseyOptions'
import { selectableSizes, shortsOptionFor } from '../../shared/services/productOptions'
import type { JerseyVersion } from '../../user/constants/jerseyOptions'
import { DEMO_COUPONS, calculateCartTotals } from '../../user/constants/cart'
import type { CartTotals, CouponDefinition } from '../../user/constants/cart'
import { createOrder } from '../../user/services/orderService'
import { ORDER_STATUSES } from '../utils/status'
import { toISODate } from '../utils/format'

/**
 * Admin › Orders › Manual Order.
 *
 * Reuses the existing data and rules — nothing is duplicated:
 * - products: the catalog (shared/data/products), blocked products excluded;
 * - jersey options: JERSEY_OPTION_PRICES (same values as the product page);
 * - badges: the Admin › Badges records applicable to the jersey (visibleBadgesFor /
 *   visibleSponsorsFor), priced by their record price;
 * - totals: calculateCartTotals (same shipping / coupon rule as the cart);
 * - saving: orderService.createOrder → the order store the Orders page, Sales
 *   Reports and the customer's Track Order page read. There is no backend yet,
 *   so the order lasts until the page is reloaded.
 * All amounts are in the catalog base currency (QAR), like the stored orders.
 */

/* ── Products ── */

export function orderableProducts(): Product[] {
  return allProducts.filter((p) => !isProductBlocked(p))
}

export function findOrderableProduct(slug: string): Product | undefined {
  return orderableProducts().find((p) => p.slug === slug)
}

/** Products whose name (or team / brand) matches the query. */
export function searchProducts(query: string, limit = 8): Product[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return orderableProducts()
    .filter((p) => [p.name, p.brandOrTeam].some((v) => v?.toLowerCase().includes(q)))
    .slice(0, limit)
}

/* ── Jersey options ── */

export interface BadgeOption {
  id: string
  name: string
  price: number
  image?: string
}

/** Badge and Sponsor Badge options for a jersey: the active badges assigned to it in Admin › Badges. */
export function jerseyBadgeOptions(product: Product): { badges: BadgeOption[]; sponsors: BadgeOption[] } {
  if (product.productType !== 'jersey') return { badges: [], sponsors: [] }
  return {
    badges: visibleBadgesFor(product).map((b) => ({ id: b.id, name: b.name, price: b.price || 0, image: b.image || undefined })),
    sponsors: visibleSponsorsFor(product).map((s) => ({ id: s.id, name: s.name, price: getBadgeById(s.id)?.price || 0, image: s.logo })),
  }
}

/* ── Lines ── */

export interface ManualOrderLine {
  key: string
  productSlug: string
  size: string
  quantity: number
  /** Jersey lines only. */
  version: JerseyVersion
  shorts: boolean
  badgeIds: string[]
  sponsorIds: string[]
}

export const MAX_QUANTITY = 99

export function newLine(product: Product): ManualOrderLine {
  return {
    key: `${product.slug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    productSlug: product.slug,
    size: '',
    quantity: 1,
    version: 'stadium',
    shorts: false,
    badgeIds: [],
    sponsorIds: [],
  }
}

export interface PricedLine {
  line: ManualOrderLine
  product: Product
  isJersey: boolean
  /** Unit price: product price + selected options. */
  unitPrice: number
  lineTotal: number
  /** Human-readable options, e.g. ["Authentic", "Shorts", "Badge: Best Seller"]. */
  options: string[]
  customization?: OrderItemCustomization
}

/** Prices a line from the product price and the existing option prices. */
export function priceLine(line: ManualOrderLine): PricedLine | null {
  const product = findOrderableProduct(line.productSlug)
  if (!product) return null
  const isJersey = product.productType === 'jersey'
  let unit = product.price
  const options: string[] = []
  let customization: OrderItemCustomization | undefined
  if (isJersey) {
    const { badges, sponsors } = jerseyBadgeOptions(product)
    const chosenBadges = badges.filter((b) => line.badgeIds.includes(b.id))
    const chosenSponsors = sponsors.filter((s) => line.sponsorIds.includes(s.id))
    if (line.version === 'authentic') unit += JERSEY_OPTION_PRICES.authentic
    // Shorts only when the jersey offers them (Admin › Products), at its own price.
    const shorts = shortsOptionFor(product)
    const withShorts = Boolean(shorts) && line.shorts
    if (shorts && withShorts) unit += shorts.price
    for (const b of [...chosenBadges, ...chosenSponsors]) unit += b.price
    options.push(line.version === 'authentic' ? 'Authentic' : 'Stadium')
    if (withShorts) options.push('Shorts')
    for (const b of chosenBadges) options.push(`Badge: ${b.name}`)
    for (const s of chosenSponsors) options.push(`Sponsor: ${s.name}`)
    customization = {
      version: line.version,
      shorts: withShorts,
      badges: chosenBadges.map((b) => b.name),
      sponsorBadges: chosenSponsors.map((s) => s.name),
    }
  }
  unit = Math.round(unit * 100) / 100
  return { line, product, isJersey, unitPrice: unit, lineTotal: Math.round(unit * line.quantity * 100) / 100, options, customization }
}

/* ── Totals (existing cart rule) ── */

export function findCoupon(code: string): CouponDefinition | null {
  return DEMO_COUPONS[code.trim().toUpperCase()] ?? null
}

export function manualOrderTotals(lines: ManualOrderLine[], coupon: CouponDefinition | null): CartTotals {
  const priced = lines.map(priceLine).filter((p): p is PricedLine => p !== null)
  return calculateCartTotals(
    priced.map((p) => ({ price: p.unitPrice, quantity: p.line.quantity })),
    coupon
  )
}

/* ── Customer ── */

export interface ManualOrderCustomer {
  name: string
  email: string
  country: string
  region: string
  /** ISO code of the calling-code country (follows Country, can be changed). */
  phoneCountry: string
  /** National number, without the calling code. */
  phone: string
  city: string
  address: string
  postalCode: string
}

export const PAYMENT_METHODS = ['Cash on Delivery', 'Credit Card', 'Apple Pay'] as const
export type ManualPaymentMethod = (typeof PAYMENT_METHODS)[number]

export function countryOptions() {
  return COUNTRIES
}

export function regionsFor(country: string): string[] {
  return COUNTRIES.find((c) => c.name === country)?.regions ?? []
}

/* ── Phone ──
 * Dialling codes and number lengths come from the shared country
 * configuration (the same rules checkout and sign-up use), so every country is
 * checked against its own length. */

export function phoneCountryFor(code: string) {
  return COUNTRIES.find((c) => c.code === code && c.dialCode)
}

export function phoneCountryCodeOf(countryName: string): string {
  return COUNTRIES.find((c) => c.name === countryName && c.dialCode)?.code ?? ''
}

/** Digits only, with one leading trunk "0" dropped (05x… → 5x…). */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^0/, '')
}

function digitRule(rule: number | [number, number] | undefined): string {
  if (rule === undefined) return '7–15 digits'
  return typeof rule === 'number' ? `${rule} digits` : `${rule[0]}–${rule[1]} digits`
}

export function phoneHint(code: string): string {
  const country = phoneCountryFor(code)
  return country ? `${country.name} (${country.dialCode}): ${digitRule(country.phoneDigits)}` : ''
}

export function validateManualPhone(code: string, phone: string): string | undefined {
  const country = phoneCountryFor(code)
  if (!phone.trim()) return 'Enter the customer’s phone number.'
  if (!country) return 'Choose the calling code.'
  if (/[^\d\s()+-]/.test(phone) || /\d\+|\+.*\+/.test(phone.trim())) return 'Use numbers only (spaces and dashes are fine).'
  const digits = phoneDigits(phone)
  const result = validatePhoneNumber(digits, country.phoneDigits)
  if (result.isValid) return undefined
  const short = typeof country.phoneDigits === 'number' ? digits.length < country.phoneDigits : Array.isArray(country.phoneDigits) && digits.length < country.phoneDigits[0]
  return `${short ? 'Incomplete' : 'Too many digits for a'} ${country.name} (${country.dialCode}) number: it needs ${digitRule(country.phoneDigits)}, you entered ${digits.length}.`
}

/** Saved form, e.g. "+974 55123456". */
export function formatManualPhone(code: string, phone: string): string {
  return `${phoneCountryFor(code)?.dialCode ?? ''} ${phoneDigits(phone)}`.trim()
}

export interface ManualOrderInput {
  customer: ManualOrderCustomer
  lines: ManualOrderLine[]
  payment: ManualPaymentMethod | ''
  couponCode: string
}

export type ManualOrderErrors = Partial<Record<keyof ManualOrderCustomer | 'products' | 'payment' | 'couponCode', string>> & {
  lines?: Record<string, string>
}

export function validateManualOrder(input: ManualOrderInput): ManualOrderErrors {
  const e: ManualOrderErrors = {}
  const c = input.customer
  if (c.name.trim().length < 2) e.name = 'Enter the customer’s full name.'
  const email = validateEmail(c.email)
  if (!email.isValid) e.email = c.email.trim() ? 'Enter a valid email address.' : 'Enter the customer’s email.'
  if (!COUNTRIES.some((x) => x.name === c.country)) e.country = 'Choose a country.'
  else if (!regionsFor(c.country).includes(c.region)) e.region = 'Choose a region / state.'
  const phone = validateManualPhone(c.phoneCountry, c.phone)
  if (phone) e.phone = phone
  if (!c.city.trim()) e.city = 'Enter the city.'
  if (c.address.trim().length < 5) e.address = 'Enter the street address.'
  if (!c.postalCode.trim()) e.postalCode = 'Enter the postal code.'
  else if (!/^[A-Za-z0-9 -]{2,12}$/.test(c.postalCode.trim())) e.postalCode = 'Use 2–12 letters, numbers, spaces or dashes.'
  if (!input.payment) e.payment = 'Choose the payment method.'
  if (input.couponCode.trim() && !findCoupon(input.couponCode)) e.couponCode = 'This coupon code doesn’t exist.'
  if (input.lines.length === 0) e.products = 'Add at least one product.'
  const lineErrors: Record<string, string> = {}
  for (const line of input.lines) {
    const product = findOrderableProduct(line.productSlug)
    if (!product) lineErrors[line.key] = 'This product is no longer available.'
    else if (!line.size || !selectableSizes(product).includes(line.size)) lineErrors[line.key] = 'Choose a size.'
    else if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_QUANTITY) lineErrors[line.key] = `Quantity must be 1–${MAX_QUANTITY}.`
  }
  if (Object.keys(lineErrors).length) e.lines = lineErrors
  return e
}

export function hasErrors(e: ManualOrderErrors): boolean {
  return Object.keys(e).some((k) => (k === 'lines' ? Object.keys(e.lines ?? {}).length > 0 : Boolean(e[k as keyof ManualOrderErrors])))
}

/* ── Order ID (existing "S90-" + 6-digit format, next in sequence) ── */

export function nextOrderId(): string {
  const max = DUMMY_ORDERS.reduce((m, o) => {
    const n = Number(/^S90-(\d+)$/i.exec(o.id)?.[1])
    return Number.isFinite(n) && n > m ? n : m
  }, 100000)
  return `S90-${max + 1}`
}

/* ── Save ── */

export class ManualOrderError extends Error {}

const TITLE_KEYS: Record<OrderStatus, string> = {
  Processing: 'orders.status.processing',
  Packed: 'orders.status.packed',
  Shipped: 'orders.status.shipped',
  'Out for delivery': 'orders.status.outForDelivery',
  Delivered: 'orders.status.delivered',
}

let saving = false

/**
 * Validates again, builds the order and saves it. Rejects (and saves nothing)
 * when validation fails, a product became unavailable, or a save is already in
 * progress — so one click can never create two orders.
 */
export async function placeManualOrder(input: ManualOrderInput, now = new Date()): Promise<Order> {
  if (saving) throw new ManualOrderError('An order is already being created. Please wait.')
  saving = true
  try {
    // Simulated network latency, like the storefront checkout handoff.
    await new Promise((r) => setTimeout(r, 450))
    const errors = validateManualOrder(input)
    if (hasErrors(errors)) {
      const first = Object.values(errors.lines ?? {})[0] ?? Object.values(errors).find((v) => typeof v === 'string')
      throw new ManualOrderError(`The order could not be created: ${first}`)
    }
    const priced = input.lines.map(priceLine)
    if (priced.some((p) => p === null)) throw new ManualOrderError('The order could not be created: a product is no longer available.')
    const lines = priced as PricedLine[]
    const coupon = input.couponCode.trim() ? findCoupon(input.couponCode) : null
    const totals = calculateCartTotals(lines.map((p) => ({ price: p.unitPrice, quantity: p.line.quantity })), coupon)

    const items: OrderItem[] = lines.map((p) => ({
      productSlug: p.product.slug,
      // Same convention as the cart: options are appended to the line name.
      productName: p.options.length && p.isJersey ? `${p.product.name} (${p.options.join(' | ')})` : p.product.name,
      productImage: p.product.images[0] ?? '',
      size: p.line.size,
      quantity: p.line.quantity,
      price: p.unitPrice,
      category: p.product.productType === 'shoe' ? 'shoes' : 'jerseys',
      ...(p.customization ? { customization: p.customization } : {}),
    }))

    const c = input.customer
    const stampDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(now)
    const stampTime = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(now)
    const order: Order = {
      id: nextOrderId(),
      date: toISODate(now),
      status: 'Processing',
      paymentMethod: input.payment,
      shippingAddress: {
        fullName: c.name.trim(),
        street: c.address.trim(),
        city: c.city.trim(),
        region: c.region,
        country: c.country,
        postalCode: c.postalCode.trim(),
        phone: formatManualPhone(c.phoneCountry, c.phone),
      },
      customerEmail: c.email.trim(),
      currency: BASE_CURRENCY,
      subtotal: totals.subtotal,
      shippingFee: totals.shippingCost,
      ...(totals.discountAmount > 0 ? { discount: totals.discountAmount, couponCode: coupon?.code } : {}),
      total: totals.finalTotal,
      items,
      timeline: ORDER_STATUSES.map((status, i) => ({
        status,
        titleKey: TITLE_KEYS[status],
        completed: i === 0,
        isCurrent: i === 0,
        ...(i === 0 ? { date: stampDate, time: stampTime } : {}),
      })),
      source: 'admin-manual',
    }
    try {
      return await createOrder(order)
    } catch (err) {
      throw new ManualOrderError(`The order could not be saved: ${err instanceof Error ? err.message : 'unknown error'}`)
    }
  } finally {
    saving = false
  }
}
