import type { Product, JerseyProduct, ShoeProduct } from '../types/product'
import { allJerseys, allShoes } from '../data/products/catalogData'
import { arabicProductTranslations } from '../data/translations'

export interface ProductFilterOptions {
  category?: string
  team?: string | string[]
  season?: string | string[]
  size?: string | string[]
  color?: string | string[]
  brand?: string | string[]
  type?: string | string[]
  price?: string
  [key: string]: string | string[] | number | undefined
}

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest'

export interface GetProductsQuery {
  page?: number
  limit?: number
  filters?: ProductFilterOptions
  sort?: string
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  totalPages: number
  page: number
  limit: number
}

/**
 * Filter jerseys by team, season, size, color, price and category
 */
function filterJersey(item: JerseyProduct, filters: ProductFilterOptions = {}): boolean {
  // Category query (?category=club, national, retro, kids)
  if (filters.category && filters.category !== 'all') {
    const cat = filters.category.toLowerCase().trim()
    const allItemCategories = (item.categories || [item.category]).map((c) => c.toLowerCase())
    if (cat === 'club') {
      const match = allItemCategories.some((c) => c.includes('club'))
      if (!match) return false
    } else if (cat === 'national') {
      const match = allItemCategories.some((c) => c.includes('national'))
      if (!match) return false
    } else if (cat === 'retro') {
      const match = allItemCategories.some((c) => c.includes('retro'))
      if (!match) return false
    } else if (cat === 'kids') {
      const match =
        item.name.toLowerCase().includes('kids') ||
        allItemCategories.some((c) => c.includes('kid')) ||
        (item.team && item.team.toLowerCase().includes('kids'))
      if (!match) return false
    } else if (cat === 'special' || cat === 'special-collections' || cat === 'limited') {
      const match =
        allItemCategories.some((c) => c.includes('special') || c.includes('limited')) ||
        item.name.toLowerCase().includes('special') ||
        item.name.toLowerCase().includes('heritage') ||
        item.name.toLowerCase().includes('edition') ||
        Boolean(item.isFeatured || item.featured)
      if (!match) return false
    } else {
      const match = allItemCategories.some((c) => c.includes(cat)) || item.name.toLowerCase().includes(cat)
      if (!match) return false
    }
  }

  // Team
  if (filters.team && filters.team !== 'all') {
    const raw = Array.isArray(filters.team) ? filters.team : [filters.team]
    const teams = raw.flatMap((t) => String(t).split(',')).map((t) => t.trim().toLowerCase()).filter(Boolean)
    if (teams.length > 0 && !teams.includes('all')) {
      const itemTeam = (item.team || item.brandOrTeam || '').toLowerCase()
      const itemName = item.name.toLowerCase()
      if (!teams.some((teamFilter) => itemTeam.includes(teamFilter) || itemName.includes(teamFilter))) {
        return false
      }
    }
  }

  // Season
  if (filters.season && filters.season !== 'all') {
    const raw = Array.isArray(filters.season) ? filters.season : [filters.season]
    const seasons = raw.flatMap((s) => String(s).split(',')).map((s) => s.trim().toLowerCase()).filter(Boolean)
    if (seasons.length > 0 && !seasons.includes('all')) {
      const text = `${item.name} ${item.description} ${item.sku}`.toLowerCase()
      const match = seasons.some((s) => {
        if (s === 'retro') {
          return item.category.toLowerCase().includes('retro') || text.includes('19')
        }
        return text.includes(s)
      })
      if (!match) return false
    }
  }

  // Size
  if (filters.size && filters.size !== 'all') {
    const raw = Array.isArray(filters.size) ? filters.size : [filters.size]
    const sizes = raw.flatMap((s) => String(s).split(',')).map((s) => s.trim().toUpperCase()).filter(Boolean)
    if (sizes.length > 0 && !sizes.includes('ALL')) {
      const itemSizes = item.availableSizes.map(String).map((s) => s.toUpperCase())
      if (!sizes.some((sz) => itemSizes.includes(sz))) {
        return false
      }
    }
  }

  // Color
  if (filters.color && filters.color !== 'all') {
    const raw = Array.isArray(filters.color) ? filters.color : [filters.color]
    const colors = raw.flatMap((c) => String(c).split(',')).map((c) => c.trim().toLowerCase()).filter(Boolean)
    if (colors.length > 0 && !colors.includes('all')) {
      const itemCol = (item.color || '').toLowerCase()
      const itemFam = (item.colorFamily || '').toLowerCase()
      if (!colors.some((col) => itemCol.includes(col) || itemFam.includes(col))) {
        return false
      }
    }
  }

  // Price
  if (filters.price && filters.price !== 'all') {
    const pr = String(filters.price)
    if (pr === 'under-150' && item.price >= 150) return false
    if (pr === '150-200' && (item.price < 150 || item.price > 200)) return false
    if (pr === 'over-200' && item.price <= 200) return false

    const parts = pr.split('-')
    if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
      const min = Number(parts[0])
      const max = Number(parts[1])
      if (item.price < min || item.price > max) return false
    }
  }

  return true
}

/**
 * Filter shoes by type, size, color, brand, price and category
 */
function filterShoe(item: ShoeProduct, filters: ProductFilterOptions = {}): boolean {
  // Category query (?category=casual, formal, sneakers, loafers)
  if (filters.category && filters.category !== 'all') {
    const cat = filters.category.toLowerCase().trim()
    const allItemCategories = (item.categories || [item.category]).map((c) => c.toLowerCase())
    if (cat === 'casual') {
      if (!allItemCategories.some((c) => c.includes('casual'))) return false
    } else if (cat === 'formal') {
      if (!allItemCategories.some((c) => c.includes('formal'))) return false
    } else if (cat === 'sneakers') {
      if (!allItemCategories.some((c) => c.includes('sneaker'))) return false
    } else if (cat === 'loafers') {
      if (!allItemCategories.some((c) => c.includes('loafer'))) return false
    } else if (cat === 'new-arrivals') {
      const isNew =
        Boolean(item.badges?.some((b) => b.toLowerCase().includes('new'))) ||
        Boolean(item.isFeatured || item.featured)
      if (!isNew) return false
    } else {
      if (!allItemCategories.some((c) => c.includes(cat)) && !item.name.toLowerCase().includes(cat)) return false
    }
  }

  // Type (same as shoe category)
  if (filters.type && filters.type !== 'all') {
    const raw = Array.isArray(filters.type) ? filters.type : [filters.type]
    const types = raw.flatMap((t) => String(t).split(',')).map((t) => t.trim().toLowerCase()).filter(Boolean)
    if (types.length > 0 && !types.includes('all')) {
      const allItemCategories = (item.categories || [item.category]).map((c) => c.toLowerCase())
      const itemName = item.name.toLowerCase()
      if (!types.some((t) => allItemCategories.some((c) => c.includes(t)) || itemName.includes(t))) {
        return false
      }
    }
  }

  // Size
  if (filters.size && filters.size !== 'all') {
    const raw = Array.isArray(filters.size) ? filters.size : [filters.size]
    const sizes = raw.flatMap((s) => String(s).split(',')).map((s) => s.trim().toUpperCase()).filter(Boolean)
    if (sizes.length > 0 && !sizes.includes('ALL')) {
      const itemSizes = item.availableSizes.map(String).map((s) => s.toUpperCase())
      if (!sizes.some((sz) => itemSizes.includes(sz))) {
        return false
      }
    }
  }

  // Color
  if (filters.color && filters.color !== 'all') {
    const raw = Array.isArray(filters.color) ? filters.color : [filters.color]
    const colors = raw.flatMap((c) => String(c).split(',')).map((c) => c.trim().toLowerCase()).filter(Boolean)
    if (colors.length > 0 && !colors.includes('all')) {
      const itemCol = (item.color || '').toLowerCase()
      const itemFam = (item.colorFamily || '').toLowerCase()
      if (!colors.some((col) => itemCol.includes(col) || itemFam.includes(col))) {
        return false
      }
    }
  }

  // Brand
  if (filters.brand && filters.brand !== 'all') {
    const raw = Array.isArray(filters.brand) ? filters.brand : [filters.brand]
    const brands = raw.flatMap((b) => String(b).split(',')).map((b) => b.trim().toLowerCase()).filter(Boolean)
    if (brands.length > 0 && !brands.includes('all')) {
      const itemBrand = (item.brand || item.brandOrTeam || '').toLowerCase()
      const itemName = item.name.toLowerCase()
      if (!brands.some((br) => itemBrand.includes(br) || itemName.includes(br))) {
        return false
      }
    }
  }

  // Price
  if (filters.price && filters.price !== 'all') {
    const pr = String(filters.price)
    if (pr === 'under-500' && item.price >= 500) return false
    if (pr === '500-1000' && (item.price < 500 || item.price > 1000)) return false
    if (pr === '1000-2500' && (item.price < 1000 || item.price > 2500)) return false
    if (pr === 'over-2500' && item.price <= 2500) return false

    const parts = pr.split('-')
    if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
      const min = Number(parts[0])
      const max = Number(parts[1])
      if (item.price < min || item.price > max) return false
    }
  }

  return true
}

/**
 * Sort list of products by chosen sort option
 */
function sortProducts<T extends Product>(list: T[], sort: string = 'featured'): T[] {
  const result = [...list]
  switch (sort) {
    case 'price-asc':
      return result.sort((a, b) => a.price - b.price)
    case 'price-desc':
      return result.sort((a, b) => b.price - a.price)
    case 'newest':
      return result.sort((a, b) => {
        const aNew = a.badges?.includes('New Arrival') ? 1 : 0
        const bNew = b.badges?.includes('New Arrival') ? 1 : 0
        return bNew - aNew
      })
    case 'featured':
    default:
      return result.sort((a, b) => {
        const aFeatured = a.isFeatured || a.featured ? 1 : 0
        const bFeatured = b.isFeatured || b.featured ? 1 : 0
        return bFeatured - aFeatured
      })
  }
}

/**
 * Main service function taking { page, limit, filters, sort } and returning { items, total, totalPages }
 */
export function getPaginatedJerseys(query: GetProductsQuery = {}): PaginatedResult<JerseyProduct> {
  const { page = 1, limit = 12, filters = {}, sort = 'featured' } = query

  const filtered = allJerseys.filter((item) => filterJersey(item, filters))
  const sorted = sortProducts(filtered, sort)

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const currentPage = Math.min(Math.max(1, page), totalPages)

  const startIndex = (currentPage - 1) * limit
  const items = sorted.slice(startIndex, startIndex + limit)

  return {
    items,
    total,
    totalPages,
    page: currentPage,
    limit,
  }
}

export function getPaginatedShoes(query: GetProductsQuery = {}): PaginatedResult<ShoeProduct> {
  const { page = 1, limit = 12, filters = {}, sort = 'featured' } = query

  const filtered = allShoes.filter((item) => filterShoe(item, filters))
  const sorted = sortProducts(filtered, sort)

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const currentPage = Math.min(Math.max(1, page), totalPages)

  const startIndex = (currentPage - 1) * limit
  const items = sorted.slice(startIndex, startIndex + limit)

  return {
    items,
    total,
    totalPages,
    page: currentPage,
    limit,
  }
}

/**
 * Universal product service taking { page, limit, filters, sort } with categoryType
 */
export function getPaginatedProducts(
  categoryType: 'jersey' | 'shoe',
  query: GetProductsQuery = {}
): PaginatedResult<Product> {
  if (categoryType === 'jersey') {
    return getPaginatedJerseys(query)
  }
  return getPaginatedShoes(query)
}


/**
 * Find single product across both catalog datasets by slug
 */
export function findProductBySlug(slug: string): Product | undefined {
  return [...allJerseys, ...allShoes].find((p) => p.slug === slug)
}

/**
 * Returns localized product text for Arabic, falling back to English.
 */
export function getLocalizedProduct<T extends Product>(product: T, lang: string): T {
  if (lang !== 'ar') {
    return product
  }

  const lookupKey = product.id || product._id || product.slug
  let translation =
    arabicProductTranslations[lookupKey] || arabicProductTranslations[product.slug]

  if (!translation && product.name) {
    if (product.name.includes('(Heritage Edition)')) {
      const baseName = product.name.replace(' (Heritage Edition)', '').trim()
      const baseMatch = Object.entries(arabicProductTranslations).find(
        ([, t]) => t.name === baseName
      )
      if (baseMatch) {
        translation = {
          name: `${baseMatch[1].name} (إصدار تراثي)`,
          category: baseMatch[1].category,
        }
      }
    } else if (product.name.includes('(Signature Series)')) {
      const baseName = product.name.replace(' (Signature Series)', '').trim()
      const baseMatch = Object.entries(arabicProductTranslations).find(
        ([, t]) => t.name === baseName
      )
      if (baseMatch) {
        translation = {
          name: `${baseMatch[1].name} (سلسلة مميزة)`,
          category: baseMatch[1].category,
        }
      }
    }
  }

  if (!translation) {
    return product
  }

  return {
    ...product,
    name: translation.name || product.name,
    category: translation.category || product.category,
  }
}

/**
 * Localize common category labels for display in Arabic.
 */
export function getLocalizedCategory(category: string, lang: string): string {
  if (!category) return category
  const lower = category.toLowerCase().trim()
  if (lang === 'ar') {
    if (lower === 'club' || lower === 'club jerseys') return 'قمصان الأندية'
    if (lower === 'national' || lower === 'national team jerseys') return 'قمصان المنتخبات'
    if (lower === 'retro' || lower === 'retro jerseys') return 'قمصان كلاسيكية'
    if (lower === 'special' || lower === 'special-collections' || lower === 'special collections') return 'مجموعات خاصة'
    if (lower === 'training' || lower === 'training jerseys') return 'قمصان التدريب'
    if (lower === 'kids' || lower === 'kids jerseys') return 'قمصان الأطفال'
    if (lower === 'sneakers') return 'سنيكرز'
    if (lower === 'loafers') return 'لوفر'
    if (lower === 'casual' || lower === 'casual shoes') return 'أحذية كاجوال'
    if (lower === 'formal' || lower === 'formal shoes') return 'أحذية رسمية'
    if (lower === 'leather' || lower === 'leather classics') return 'أحذية جلدية'
    if (lower === 'new-arrivals') return 'وصل حديثاً'
    if (lower === 'track order') return 'تتبع الطلب'
    return category
  }

  const enMap: Record<string, string> = {
    club: 'Club Jerseys',
    national: 'National Team Jerseys',
    retro: 'Retro & Classic',
    special: 'Special Collections',
    'special-collections': 'Special Collections',
    kids: 'Kids Jerseys',
    training: 'Training Kits',
    sneakers: 'Sneakers',
    loafers: 'Loafers',
    casual: 'Casual Shoes',
    formal: 'Formal Shoes',
    leather: 'Leather Classics',
    'new-arrivals': 'New Arrivals',
  }
  return enMap[lower] || category
}


