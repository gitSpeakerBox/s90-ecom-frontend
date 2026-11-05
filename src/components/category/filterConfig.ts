import type { JerseyProduct, ShoeProduct, Product } from '../../types/product'

export interface FilterOption {
  label: string
  value: string
  hex?: string
  count?: number
}

export type SectionContentType =
  | 'checkbox'
  | 'size-toggle'
  | 'color-swatch'
  | 'price-range'
  | 'sort-radio'

export interface FilterSectionConfig {
  id: string
  label: string
  type: SectionContentType
  options?: FilterOption[]
  minPrice?: number
  maxPrice?: number
  step?: number
}

export const SORT_OPTIONS: FilterOption[] = [
  { label: 'Featured', value: 'featured' },
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
]

export const COLOR_SWATCH_MAP: Record<string, string> = {
  white: '#ffffff',
  black: '#111111',
  navy: '#0f2942',
  blue: '#2563eb',
  red: '#dc2626',
  pink: '#f472b6',
  yellow: '#eab308',
  gray: '#6b7280',
  grey: '#6b7280',
  brown: '#6f4e37',
  tan: '#d2b48c',
  beige: '#d9cdb8',
}

export const JERSEY_FILTER_CONFIG: FilterSectionConfig[] = [
  {
    id: 'team',
    label: 'TEAM',
    type: 'checkbox',
    options: [
      { label: 'Real Madrid', value: 'Real Madrid' },
      { label: 'Barcelona', value: 'Barcelona' },
      { label: 'Manchester United', value: 'Manchester United' },
      { label: 'PSG', value: 'PSG' },
      { label: 'Inter Miami', value: 'Inter Miami' },
      { label: 'Al Nassr', value: 'Al Nassr' },
      { label: 'Germany', value: 'Germany' },
      { label: 'AC Milan', value: 'AC Milan' },
      { label: 'Apex Athletic Club', value: 'Apex Athletic Club' },
      { label: 'Atlas Lions', value: 'Atlas Lions' },
      { label: 'Continental', value: 'Continental' },
    ],
  },
  {
    id: 'season',
    label: 'SEASON',
    type: 'checkbox',
    options: [
      { label: '2024/25', value: '24/25' },
      { label: 'Retro / Heritage', value: 'retro' },
    ],
  },
  {
    id: 'size',
    label: 'SIZE',
    type: 'size-toggle',
    options: [
      { label: 'XS', value: 'XS' },
      { label: 'S', value: 'S' },
      { label: 'M', value: 'M' },
      { label: 'L', value: 'L' },
      { label: 'XL', value: 'XL' },
      { label: 'XXL', value: 'XXL' },
    ],
  },
  {
    id: 'color',
    label: 'COLOR',
    type: 'color-swatch',
    options: [
      { label: 'White', value: 'white', hex: '#ffffff' },
      { label: 'Navy', value: 'navy', hex: '#0f2942' },
      { label: 'Red', value: 'red', hex: '#dc2626' },
      { label: 'Pink', value: 'pink', hex: '#f472b6' },
      { label: 'Yellow', value: 'yellow', hex: '#eab308' },
      { label: 'Blue', value: 'blue', hex: '#2563eb' },
      { label: 'Black', value: 'black', hex: '#111111' },
      { label: 'Gray', value: 'gray', hex: '#6b7280' },
    ],
  },
  {
    id: 'price',
    label: 'PRICE',
    type: 'price-range',
    minPrice: 200,
    maxPrice: 400,
    step: 5,
  },
  {
    id: 'sort',
    label: 'SORT BY',
    type: 'sort-radio',
    options: SORT_OPTIONS,
  },
]

export const SHOE_FILTER_CONFIG: FilterSectionConfig[] = [
  {
    id: 'type',
    label: 'TYPE',
    type: 'checkbox',
    options: [
      { label: 'Casual', value: 'casual' },
      { label: 'Formal', value: 'formal' },
      { label: 'Sneakers', value: 'sneakers' },
      { label: 'Loafers', value: 'loafers' },
    ],
  },
  {
    id: 'size',
    label: 'SIZE',
    type: 'size-toggle',
    options: [
      { label: '39', value: '39' },
      { label: '40', value: '40' },
      { label: '41', value: '41' },
      { label: '42', value: '42' },
      { label: '43', value: '43' },
      { label: '44', value: '44' },
      { label: '45', value: '45' },
    ],
  },
  {
    id: 'color',
    label: 'COLOR',
    type: 'color-swatch',
    options: [
      { label: 'Black', value: 'black', hex: '#111111' },
      { label: 'White', value: 'white', hex: '#ffffff' },
      { label: 'Brown', value: 'brown', hex: '#6f4e37' },
      { label: 'Tan', value: 'tan', hex: '#d2b48c' },
      { label: 'Grey', value: 'grey', hex: '#6b7280' },
      { label: 'Blue', value: 'blue', hex: '#2563eb' },
      { label: 'Beige', value: 'beige', hex: '#d9cdb8' },
      { label: 'Red', value: 'red', hex: '#dc2626' },
    ],
  },
  {
    id: 'brand',
    label: 'BRAND',
    type: 'checkbox',
    options: [
      { label: 'Saint Laurent', value: 'Saint Laurent' },
      { label: 'Gucci', value: 'Gucci' },
      { label: 'Balenciaga', value: 'Balenciaga' },
      { label: "Tod's", value: "Tod's" },
      { label: 'Clarks', value: 'Clarks' },
      { label: 'New Balance', value: 'New Balance' },
      { label: 'Birkenstock', value: 'Birkenstock' },
      { label: 'Aurelius London', value: 'Aurelius London' },
      { label: 'Monaco Footwear', value: 'Monaco Footwear' },
      { label: 'Solestride Footwear', value: 'Solestride Footwear' },
      { label: 'Veluto & Co.', value: 'Veluto & Co.' },
    ],
  },
  {
    id: 'price',
    label: 'PRICE',
    type: 'price-range',
    minPrice: 300,
    maxPrice: 800,
    step: 10,
  },
  {
    id: 'sort',
    label: 'SORT BY',
    type: 'sort-radio',
    options: SORT_OPTIONS,
  },
]

export function computeJerseyOptionCounts(
  products: JerseyProduct[],
  sectionId: string,
  optionValue: string
): number {
  const val = optionValue.toLowerCase()
  switch (sectionId) {
    case 'team': {
      return products.filter((p) => {
        const itemTeam = (p.team || p.brandOrTeam || '').toLowerCase()
        const itemName = p.name.toLowerCase()
        return itemTeam.includes(val) || itemName.includes(val)
      }).length
    }
    case 'season': {
      return products.filter((p) => {
        const text = `${p.name} ${p.description} ${p.sku}`.toLowerCase()
        if (val === 'retro') {
          return (
            (p.category && p.category.toLowerCase().includes('retro')) ||
            text.includes('19')
          )
        }
        return text.includes(val)
      }).length
    }
    case 'size': {
      const sz = optionValue.toUpperCase()
      return products.filter((p) =>
        p.availableSizes.map(String).map((s) => s.toUpperCase()).includes(sz)
      ).length
    }
    case 'color': {
      return products.filter((p) => {
        const itemCol = (p.color || '').toLowerCase()
        const itemFam = (p.colorFamily || '').toLowerCase()
        return itemCol.includes(val) || itemFam.includes(val)
      }).length
    }
    default:
      return 0
  }
}

export function computeShoeOptionCounts(
  products: ShoeProduct[],
  sectionId: string,
  optionValue: string
): number {
  const val = optionValue.toLowerCase()
  switch (sectionId) {
    case 'type': {
      return products.filter((p) => {
        const allCategories = (p.categories || [p.category]).map((c) =>
          c.toLowerCase()
        )
        const name = p.name.toLowerCase()
        return allCategories.some((c) => c.includes(val)) || name.includes(val)
      }).length
    }
    case 'brand': {
      return products.filter((p) => {
        const brand = (p.brand || p.brandOrTeam || '').toLowerCase()
        const name = p.name.toLowerCase()
        return brand.includes(val) || name.includes(val)
      }).length
    }
    case 'size': {
      const sz = String(optionValue)
      return products.filter((p) => p.availableSizes.map(String).includes(sz))
        .length
    }
    case 'color': {
      return products.filter((p) => {
        const itemCol = (p.color || '').toLowerCase()
        const itemFam = (p.colorFamily || '').toLowerCase()
        return itemCol.includes(val) || itemFam.includes(val)
      }).length
    }
    default:
      return 0
  }
}

export function computeOptionCounts(
  products: Product[],
  pageType: 'jersey' | 'shoe',
  sectionId: string,
  optionValue: string
): number {
  if (pageType === 'jersey') {
    return computeJerseyOptionCounts(
      products as JerseyProduct[],
      sectionId,
      optionValue
    )
  }
  return computeShoeOptionCounts(
    products as ShoeProduct[],
    sectionId,
    optionValue
  )
}

