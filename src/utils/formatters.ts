/**
 * Price and number formatting utilities.
 * Ensures Western digits (0-9) are kept even in Arabic mode via 'ar-QA-u-nu-latn'.
 */

export function formatPrice(
  amount: number,
  language: string = 'en',
  currency: string = 'QAR'
): string {
  const locale = language === 'ar' ? 'ar-QA-u-nu-latn' : 'en-QA'
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

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


