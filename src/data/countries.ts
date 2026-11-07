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
}

export const DEFAULT_COUNTRY = COUNTRIES[1] // Qatar
