export interface Country {
  name: string
  code: string
  currency: string
  flag: string
}

export const COUNTRIES: Country[] = [
  { name: 'Saudi Arabia', code: 'SA', currency: 'SAR', flag: 'sa' },
  { name: 'Qatar', code: 'QA', currency: 'QAR', flag: 'qa' },
  { name: 'Oman', code: 'OM', currency: 'OMR', flag: 'om' },
  { name: 'UAE (Dubai)', code: 'AE', currency: 'AED', flag: 'ae' },
  { name: 'USA', code: 'US', currency: 'USD', flag: 'us' },
  { name: 'UK', code: 'GB', currency: 'GBP', flag: 'gb' },
]

export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  'Saudi Arabia': 'SAR',
  Qatar: 'QAR',
  Oman: 'OMR',
  'UAE (Dubai)': 'AED',
  USA: 'USD',
  UK: 'GBP',
}

export const DEFAULT_COUNTRY = COUNTRIES[1] // Qatar

