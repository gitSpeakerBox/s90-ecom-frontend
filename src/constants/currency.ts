/**
 * Centralized Currency and Exchange Rate Configuration for S90 Ecommerce.
 *
 * Base Currency:
 * - Product catalog prices (in jerseys.ts, shoes.ts, etc.) are canonically defined in QAR (Qatari Riyal).
 *
 * Source & Peg Information:
 * - GCC currencies (SAR, AED, BHD, OMR) and QAR are pegged to the USD:
 *   - USD / QAR = 3.64 (1 QAR = ~0.2747 USD)
 *   - USD / SAR = 3.75 (1 QAR = ~1.03 SAR, effectively 1:1 in retail parity or peg-derived 3.75/3.64 = 1.0302)
 *   - USD / AED = 3.6725 (1 QAR = ~1.0089 AED)
 *   - USD / BHD = 0.376 (1 QAR = ~0.1033 BHD)
 *   - USD / OMR = 0.3845 (1 QAR = ~0.1056 OMR)
 *   - EUR / USD = ~1.08 (1 QAR = ~0.2544 EUR)
 *   - GBP / USD = ~1.28 (1 QAR = ~0.2146 GBP)
 * - Reference source: Official Central Bank exchange pegs and standard international FX reference rates.
 * - Strategy: Fixed peg configuration with safe 1.0 fallback. Ready for future dynamic API feed injection.
 */

export const BASE_CURRENCY = 'QAR'

export type SupportedCurrency = 'QAR' | 'SAR' | 'AED' | 'BHD' | 'OMR' | 'USD' | 'EUR' | 'GBP'

export interface CurrencyConfig {
  code: SupportedCurrency
  symbol: string
  name: string
  /** Conversion multiplier from BASE_CURRENCY (QAR) to this currency */
  rateFromBase: number
  decimals: number
}

export const CURRENCY_CONFIG: Record<SupportedCurrency, CurrencyConfig> = {
  QAR: {
    code: 'QAR',
    symbol: 'QAR',
    name: 'Qatari Riyal',
    rateFromBase: 1.0,
    decimals: 2,
  },
  SAR: {
    code: 'SAR',
    symbol: 'SAR',
    name: 'Saudi Riyal',
    rateFromBase: 1.0302, // 3.75 / 3.64
    decimals: 2,
  },
  AED: {
    code: 'AED',
    symbol: 'AED',
    name: 'UAE Dirham',
    rateFromBase: 1.0089, // 3.6725 / 3.64
    decimals: 2,
  },
  BHD: {
    code: 'BHD',
    symbol: 'BHD',
    name: 'Bahraini Dinar',
    rateFromBase: 0.1033, // 0.376 / 3.64
    decimals: 3,
  },
  OMR: {
    code: 'OMR',
    symbol: 'OMR',
    name: 'Omani Rial',
    rateFromBase: 0.1056, // 0.3845 / 3.64
    decimals: 3,
  },
  USD: {
    code: 'USD',
    symbol: 'USD',
    name: 'US Dollar',
    rateFromBase: 0.2747, // 1 / 3.64
    decimals: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    rateFromBase: 0.2544, // 0.2747 / 1.08
    decimals: 2,
  },
  GBP: {
    code: 'GBP',
    symbol: 'GBP',
    name: 'British Pound',
    rateFromBase: 0.2146, // 0.2747 / 1.28
    decimals: 2,
  },
}

/**
 * Fallback rate if an unsupported or unknown currency is requested.
 */
export const DEFAULT_FALLBACK_RATE = 1.0

/**
 * Standard checkout payment currency rule:
 * In accordance with client requirements:
 * - Browsing display currency follows user country selection (or QAR default).
 * - Qatar checkout settlement is standard USD client requirement (or customizable per market).
 */
export const CHECKOUT_PAYMENT_CURRENCY: SupportedCurrency = 'USD'

