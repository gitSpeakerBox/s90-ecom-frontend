/**
 * Currency conversion service for S90 Ecommerce.
 *
 * Provides pure, deterministic currency conversion functions between
 * base product catalog currency (QAR) and target display/settlement currencies.
 */

import {
  BASE_CURRENCY,
  CURRENCY_CONFIG,
  DEFAULT_FALLBACK_RATE,
  type SupportedCurrency,
} from '../constants/currency'

/**
 * Returns the exchange rate from base currency (QAR) to the target currency.
 */
export function getExchangeRate(
  targetCurrency: string,
  baseCurrency: string = BASE_CURRENCY
): number {
  if (targetCurrency === baseCurrency) return 1.0

  const targetConfig = CURRENCY_CONFIG[targetCurrency as SupportedCurrency]
  const baseConfig = CURRENCY_CONFIG[baseCurrency as SupportedCurrency]

  const rateTarget = targetConfig ? targetConfig.rateFromBase : DEFAULT_FALLBACK_RATE
  const rateBase = baseConfig ? baseConfig.rateFromBase : DEFAULT_FALLBACK_RATE

  if (rateBase <= 0) return DEFAULT_FALLBACK_RATE

  return rateTarget / rateBase
}

/**
 * Converts a numerical amount from a base currency (default QAR) to target currency.
 * Avoids double conversion by assuming inputs represent base currency unless specified.
 */
export function convertCurrency(
  amount: number,
  targetCurrency: string,
  baseCurrency: string = BASE_CURRENCY
): number {
  if (!amount || isNaN(amount)) return 0
  if (targetCurrency === baseCurrency) return amount

  const rate = getExchangeRate(targetCurrency, baseCurrency)
  const converted = amount * rate

  // Determine decimal precision (e.g. OMR uses 3 decimals, others use 2)
  const decimals = CURRENCY_CONFIG[targetCurrency as SupportedCurrency]?.decimals ?? 2
  const factor = 10 ** decimals

  return Math.round(converted * factor) / factor
}

