/**
 * Price and number formatting utilities.
 * Ensures Western digits (0-9) are kept even in Arabic mode via 'ar-QA-u-nu-latn'.
 * Integrates centralized currency conversion from base catalog currency (QAR).
 */

import { convertCurrency } from '../services/currencyService'
import { BASE_CURRENCY, CURRENCY_CONFIG, type SupportedCurrency } from '../constants/currency'

export interface FormatPriceOptions {
  /** Source currency of the raw amount, defaults to BASE_CURRENCY ('QAR') */
  fromCurrency?: string
  /** Whether the incoming amount is already converted, avoiding redundant conversion */
  alreadyConverted?: boolean
}

/**
 * Formats a monetary amount into a localized currency string.
 * Automatically converts from base currency (QAR) to display currency unless alreadyConverted is true.
 *
 * Preserves Arabic RTL direction and number formatting rules (Western digits).
 */
export function formatPrice(
  amount: number,
  language: string = 'en',
  currency: string = BASE_CURRENCY,
  options?: FormatPriceOptions
): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${currency} 0.00`
  }

  const { fromCurrency = BASE_CURRENCY, alreadyConverted = false } = options || {}

  const finalAmount = alreadyConverted
    ? amount
    : convertCurrency(amount, currency, fromCurrency)

  const decimals = CURRENCY_CONFIG[currency as SupportedCurrency]?.decimals ?? 2
  const locale = language === 'ar' ? 'ar-QA-u-nu-latn' : 'en-QA'

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(finalAmount)

  return `${currency} ${formatted}`
}

export function formatNumber(
  num: number,
  language: string = 'en'
): string {
  const locale = language === 'ar' ? 'ar-QA-u-nu-latn' : 'en-QA'
  return new Intl.NumberFormat(locale).format(num)
}

const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

/**
 * Converts Latin numerals (0-9) in any string or number to Eastern Arabic numerals (٠-٩).
 */
export function toArabicNumerals(value: number | string): string {
  return String(value).replace(/\d/g, (d) => ARABIC_INDIC_DIGITS[Number(d)])
}

/**
 * Formats a pagination page number or string based on current language.
 * When language is 'ar', displays Arabic numerals (٠١٢٣٤٥٦٧٨٩).
 * When language is 'en', displays English numerals (0123456789).
 */
export function formatPaginationNumber(
  value: number | string,
  language: string = 'en'
): string {
  if (language === 'ar') {
    return toArabicNumerals(value)
  }
  return String(value)
}
