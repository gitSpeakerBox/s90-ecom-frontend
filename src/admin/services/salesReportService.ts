import type { Order, OrderStatus } from '../../shared/types/order'
import { BASE_CURRENCY, CURRENCY_CONFIG } from '../../shared/constants/currency'
import { convertCurrency } from '../../shared/services/currencyService'
import { formatConverted } from '../utils/revenueCurrency'
import type { RevenueCurrency } from '../utils/revenueCurrency'
import { getPaymentStatus } from './orderAdminService'
import { isInRange } from '../utils/dateRange'
import { includesText } from '../utils/format'
import type { DateRange } from '../types/admin'

/**
 * Sales report over the existing orders (listOrders → src/shared/data/orders.ts).
 * Nothing is copied or written back: every figure is read from the stored order
 * and converted from its ORIGINAL amount on each call, so a converted value is
 * never converted again and order data never changes.
 */

/* ── Payment method ── */

/** Payment method family used by the filter. Derived from the stored method text. */
export type PaymentMethodType = 'Card' | 'Apple Pay' | 'Cash on Delivery' | 'Other'

export function paymentMethodType(order: Order): PaymentMethodType {
  const m = order.paymentMethod
  if (/cash on delivery/i.test(m)) return 'Cash on Delivery'
  if (/apple pay/i.test(m)) return 'Apple Pay'
  if (/card|visa|mastercard|american express|amex/i.test(m)) return 'Card'
  return 'Other'
}

/** Filter options: only the method types that occur in the orders. */
export function paymentMethodOptions(orders: Order[]): PaymentMethodType[] {
  const order: PaymentMethodType[] = ['Card', 'Apple Pay', 'Cash on Delivery', 'Other']
  const present = new Set(orders.map(paymentMethodType))
  return order.filter((t) => present.has(t))
}

/* ── Amounts (always from the stored order) ── */

/** Discount on the order, from its stored figures: subtotal + shipping − total (never negative). */
export function orderDiscount(order: Order): number {
  const d = order.subtotal + order.shippingFee - order.total
  return d > 0.005 ? Math.round(d * 100) / 100 : 0
}

/** An original order amount (in the order's own currency) converted to the report currency, once. */
export function convertOrderAmount(order: Order, amount: number, currency: RevenueCurrency): number {
  const from = order.currency || BASE_CURRENCY
  return from === currency ? amount : convertCurrency(amount, currency, from)
}

/** Formatted original order amount with the currency CODE ("QAR 1,615.00"), converted exactly once. Used by the PDF export. */
export function formatOrderAmount(order: Order, amount: number, currency: RevenueCurrency): string {
  return formatConverted(convertOrderAmount(order, amount, currency), currency)
}

/**
 * Currency symbols for the Sales Report screen (table and order details).
 * Display only: codes, rates and conversion are unchanged, and the shared
 * storefront currency config is not touched.
 */
export const REPORT_CURRENCY_SYMBOL: Record<RevenueCurrency, string> = {
  QAR: 'ر.ق',
  AED: 'د.إ',
  SAR: 'ر.س',
  USD: '$',
  GBP: '£',
}

const FSI = '⁨' // first-strong isolate
const PDI = '⁩' // pop directional isolate

/** An amount ALREADY in `currency`, shown with its symbol: "د.إ 4,918.39", "$ 1,629.37". */
export function formatWithSymbol(amount: number, currency: RevenueCurrency): string {
  const decimals = CURRENCY_CONFIG[currency].decimals
  const number = new Intl.NumberFormat('en-QA', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount)
  // The symbol is isolated so an Arabic symbol never reorders the digits after it.
  return `${FSI}${REPORT_CURRENCY_SYMBOL[currency]}${PDI} ${number}`
}

/** Original order amount in the report currency with its symbol (converted exactly once). */
export function displayOrderAmount(order: Order, amount: number, currency: RevenueCurrency): string {
  return formatWithSymbol(convertOrderAmount(order, amount, currency), currency)
}

/* ── Revenue ── */

/**
 * Revenue rule: an order counts once, at its stored total, when it is paid.
 * The order data has no cancelled status; Cash on Delivery orders are unpaid
 * until delivered (getPaymentStatus) and are excluded until then.
 */
export function countsAsRevenue(order: Order): boolean {
  return getPaymentStatus(order) === 'Paid'
}

export interface RevenueSummary {
  /** Total revenue in the report currency. */
  revenue: number
  paidOrders: number
  /** Orders in the report not counted (unpaid). */
  excludedOrders: number
  /** Their total in the report currency. */
  excludedAmount: number
}

/**
 * Sums the ORIGINAL totals (converted to the base currency only if an order
 * was stored in another currency) and converts the sum to the report currency
 * once. Formatted strings are never added.
 */
export function revenueSummary(orders: Order[], currency: RevenueCurrency): RevenueSummary {
  let paidBase = 0
  let excludedBase = 0
  let paidOrders = 0
  const seen = new Set<string>()
  for (const o of orders) {
    if (seen.has(o.id)) continue // never count an order twice
    seen.add(o.id)
    const base = convertOrderAmount(o, o.total, BASE_CURRENCY as RevenueCurrency)
    if (countsAsRevenue(o)) {
      paidBase += base
      paidOrders++
    } else excludedBase += base
  }
  const toReport = (amount: number) => (currency === BASE_CURRENCY ? amount : convertCurrency(amount, currency))
  return {
    revenue: toReport(Math.round(paidBase * 100) / 100),
    paidOrders,
    excludedOrders: seen.size - paidOrders,
    excludedAmount: toReport(Math.round(excludedBase * 100) / 100),
  }
}

/* ── Filters ── */

export interface SalesReportFilters {
  query: string
  range: DateRange
  payment: PaymentMethodType | 'all'
  status: OrderStatus | 'all'
}

/** All filters applied together; newest first. */
export function filterSalesOrders(orders: Order[], f: SalesReportFilters): Order[] {
  return orders
    .filter(
      (o) =>
        isInRange(o.date, f.range) &&
        (f.payment === 'all' || paymentMethodType(o) === f.payment) &&
        (f.status === 'all' || o.status === f.status) &&
        includesText([o.shippingAddress.fullName, o.id], f.query)
    )
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id.localeCompare(a.id)))
}
