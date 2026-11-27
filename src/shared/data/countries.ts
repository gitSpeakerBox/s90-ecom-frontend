export interface Country {
  name: string
  code: string
  currency: string
  flag: string
  dialCode?: string
  phoneDigits?: number | [number, number]
  deliveryDays?: string
  regions?: string[]
}

export const COUNTRIES: Country[] = [
  {
    name: 'Saudi Arabia',
    code: 'SA',
    currency: 'SAR',
    flag: 'sa',
    dialCode: '+966',
    phoneDigits: 9,
    deliveryDays: '7-12 days',
    regions: [
      'Riyadh',
      'Makkah',
      'Eastern Province',
      'Madinah',
      'Asir',
      'Tabuk',
      'Qassim',
      'Najran',
      'Jazan',
    ],
  },
  {
    name: 'Qatar',
    code: 'QA',
    currency: 'QAR',
    flag: 'qa',
    dialCode: '+974',
    phoneDigits: 8,
    deliveryDays: '7-12 days',
    regions: [
      'Al Wakrah',
      'Doha',
      'Al Rayyan',
      'Al Daayen',
      'Umm Salal',
      'Al Khor',
      'Al Shamal',
      'Al Sheehaniya',
    ],
  },
  {
    name: 'Bahrain',
    code: 'BH',
    currency: 'BHD',
    flag: 'bh',
    dialCode: '+973',
    phoneDigits: 8,
    deliveryDays: '7-12 days',
    regions: ['Capital', 'Muharraq', 'Northern', 'Southern'],
  },
  {
    name: 'Oman',
    code: 'OM',
    currency: 'OMR',
    flag: 'om',
    dialCode: '+968',
    phoneDigits: 8,
    deliveryDays: '7-12 days',
    regions: ['Muscat', 'Dhofar', 'Musandam', 'Al Batinah', 'Al Dakhiliyah'],
  },
  {
    name: 'UAE (Dubai)',
    code: 'AE',
    currency: 'AED',
    flag: 'ae',
    dialCode: '+971',
    phoneDigits: 9,
    deliveryDays: '7-12 days',
    regions: [
      'Dubai',
      'Abu Dhabi',
      'Sharjah',
      'Ajman',
      'Ras Al Khaimah',
      'Fujairah',
      'Umm Al Quwain',
    ],
  },
  {
    name: 'Germany',
    code: 'DE',
    currency: 'EUR',
    flag: 'de',
    dialCode: '+49',
    phoneDigits: [10, 11],
    deliveryDays: '10-15 days',
    regions: ['Bavaria', 'Berlin', 'Hamburg', 'Hesse', 'North Rhine-Westphalia'],
  },
  {
    name: 'France',
    code: 'FR',
    currency: 'EUR',
    flag: 'fr',
    dialCode: '+33',
    phoneDigits: 9,
    deliveryDays: '10-15 days',
    regions: [
      'Île-de-France',
      'Auvergne-Rhône-Alpes',
      'Provence-Alpes-Côte d\'Azur',
      'Nouvelle-Aquitaine',
    ],
  },
  {
    name: 'USA',
    code: 'US',
    currency: 'USD',
    flag: 'us',
    dialCode: '+1',
    phoneDigits: 10,
    deliveryDays: '10-15 days',
    regions: [
      'California',
      'New York',
      'Texas',
      'Florida',
      'Illinois',
      'Washington',
    ],
  },
  {
    name: 'UK',
    code: 'GB',
    currency: 'GBP',
    flag: 'gb',
    dialCode: '+44',
    phoneDigits: 10,
    deliveryDays: '10-15 days',
    regions: [
      'Greater London',
      'West Midlands',
      'Greater Manchester',
      'Scotland',
      'Wales',
    ],
  },
  {
    name: 'India',
    code: 'IN',
    currency: 'INR',
    flag: 'in',
    dialCode: '+91',
    phoneDigits: 10,
    deliveryDays: '10-15 days',
    regions: [
      'Delhi',
      'Maharashtra',
      'Karnataka',
      'Tamil Nadu',
      'Kerala',
      'Gujarat',
      'Telangana',
      'West Bengal',
      'Uttar Pradesh',
    ],
  },
]

export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  'Saudi Arabia': 'SAR',
  Qatar: 'QAR',
  Bahrain: 'BHD',
  Oman: 'OMR',
  'UAE (Dubai)': 'AED',
  Germany: 'EUR',
  France: 'EUR',
  USA: 'USD',
  UK: 'GBP',
  India: 'INR',
}

export const DEFAULT_COUNTRY = COUNTRIES[1] // Qatar

/**
 * Look up a country from the supported COUNTRIES list by 2-letter ISO code or country name.
 * Handles case-insensitivity and common country name aliases (e.g. UAE, United States).
 */
export function findCountryByCodeOrName(codeOrName?: string | null): Country | undefined {
  if (!codeOrName) return undefined
  const query = codeOrName.trim().toUpperCase()
  if (!query) return undefined

  // 1. Exact match on 2-letter ISO code
  const byCode = COUNTRIES.find((c) => c.code.toUpperCase() === query)
  if (byCode) return byCode

  // 2. Exact match on country name
  const byName = COUNTRIES.find((c) => c.name.toUpperCase() === query)
  if (byName) return byName

  // 3. Common aliases
  if (query === 'UAE' || query === 'UNITED ARAB EMIRATES') {
    return COUNTRIES.find((c) => c.code === 'AE')
  }
  if (
    query === 'US' ||
    query === 'USA' ||
    query === 'UNITED STATES' ||
    query === 'UNITED STATES OF AMERICA'
  ) {
    return COUNTRIES.find((c) => c.code === 'US')
  }
  if (
    query === 'UK' ||
    query === 'UNITED KINGDOM' ||
    query === 'GREAT BRITAIN'
  ) {
    return COUNTRIES.find((c) => c.code === 'GB')
  }
  if (query === 'KSA' || query === 'SAUDI') {
    return COUNTRIES.find((c) => c.code === 'SA')
  }

  // 4. Substring or partial match fallback
  return COUNTRIES.find(
    (c) =>
      c.name.toUpperCase().includes(query) ||
      query.includes(c.name.toUpperCase())
  )
}
