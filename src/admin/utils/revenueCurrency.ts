import { BASE_CURRENCY, CURRENCY_CONFIG } from '../../shared/constants/currency'
import type { SupportedCurrency } from '../../shared/constants/currency'
import { convertCurrency, getExchangeRate } from '../../shared/services/currencyService'
import { formatPrice } from '../../shared/utils/formatters'

/**
 * Display currencies for the Dashboard "Total Revenue" card.
 *
 * Rates come from the project's existing fixed configuration
 * (src/shared/constants/currency.ts) — no rates are defined here.
 * - SAR, AED, USD: QAR and these currencies are pegged to the USD, so the
 *   configured rates are fixed peg-derived values.
 * - GBP: floats against the USD; the configured rate is a static reference
 *   (~1.28 USD/GBP), NOT a live market rate, and is labelled approximate.
 */
export type RevenueCurrency = Extract<SupportedCurrency, 'QAR' | 'AED' | 'SAR' | 'USD' | 'GBP'>

export const BASE_REVENUE_CURRENCY: RevenueCurrency = BASE_CURRENCY as RevenueCurrency

const RATE_KIND: Record<RevenueCurrency, 'base' | 'peg' | 'reference'> = {
  QAR: 'base',
  AED: 'peg',
  SAR: 'peg',
  USD: 'peg',
  GBP: 'reference',
}

export const REVENUE_CURRENCIES: { code: RevenueCurrency; name: string }[] = (
  ['QAR', 'AED', 'SAR', 'USD', 'GBP'] as const
).map((code) => ({ code, name: CURRENCY_CONFIG[code].name }))

/**
 * Converts an ORIGINAL base-currency (QAR) amount to the display currency.
 * Callers must always pass base amounts — never a previously converted value.
 */
export function convertFromBase(baseAmount: number, currency: RevenueCurrency): number {
  return currency === BASE_CURRENCY ? baseAmount : convertCurrency(baseAmount, currency)
}

/**
 * Formats an amount that is ALREADY in `currency` (e.g. a converted chart
 * value). `compact` gives "AED 10.2K"-style labels for axes and legends.
 * With QAR this produces exactly the same strings as utils/format `money()`.
 */
export function formatConverted(
  amount: number,
  currency: RevenueCurrency,
  opts: { compact?: boolean; axis?: boolean } = {}
): string {
  if (opts.compact && Math.abs(amount) >= 1000) {
    const formatted = new Intl.NumberFormat('en-QA', { notation: 'compact', maximumFractionDigits: 1 }).format(amount)
    return `${currency} ${formatted}`
  }
  if (opts.axis && currency !== BASE_CURRENCY) {
    // Axis labels for converted amounts below 1,000 drop the
    // decimals so they fit the axis ("USD 900"). QAR output is left exactly
    // as before so charts shared with Sales Reports render unchanged.
    return `${currency} ${new Intl.NumberFormat('en-QA', { maximumFractionDigits: 0 }).format(amount)}`
  }
  return formatPrice(amount, 'en', currency, { alreadyConverted: true })
}

/** Base (QAR) amount → formatted display string, converted exactly once. */
export function formatFromBase(
  baseAmount: number,
  currency: RevenueCurrency,
  opts: { compact?: boolean } = {}
): string {
  return formatConverted(convertFromBase(baseAmount, currency), currency, opts)
}

export interface RevenueDisplay {
  /** e.g. "AED 10,210.07" — always converted from the original QAR amount. */
  formatted: string
  /** Short label shown under the value (null for the base currency). */
  rateNote: string | null
  /** Longer explanation for the tooltip. */
  rateDetail?: string
}

/**
 * Formats a QAR base amount in the chosen currency. The input is never
 * mutated or re-used as a converted value: every call converts from the base
 * amount exactly once (formatPrice → convertCurrency from QAR).
 */
export function formatRevenue(baseAmount: number, currency: RevenueCurrency): RevenueDisplay {
  const formatted = formatPrice(baseAmount, 'en', currency)
  const kind = RATE_KIND[currency]
  if (kind === 'base') return { formatted, rateNote: null }

  const rate = getExchangeRate(currency)
  const rateText = `1 ${BASE_CURRENCY} = ${rate.toFixed(4)} ${currency}`
  if (kind === 'peg') {
    return {
      formatted,
      rateNote: `${rateText} (fixed peg)`,
      rateDetail: `Converted from ${formatPrice(baseAmount, 'en', BASE_CURRENCY)} using the fixed USD-peg rate in src/shared/constants/currency.ts.`,
    }
  }
  return {
    formatted: formatted,
    rateNote: `≈ ${rateText} (approx.)`,
    rateDetail: `Approximate: GBP is not pegged, and the project has no live exchange-rate source. This uses the static reference rate in src/shared/constants/currency.ts. Original amount: ${formatPrice(baseAmount, 'en', BASE_CURRENCY)}.`,
  }
}
