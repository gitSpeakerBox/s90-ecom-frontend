import type { Product, JerseyProduct, ShoeProduct } from '../types/product'
import { allJerseys, allShoes, allProducts, getProductBySlug, getProductById } from '../data/products'
import { arabicProductTranslations } from '../data/translations'

export { allJerseys, allShoes, allProducts } from '../data/products'

/**
 * Returns the full catalog product array for a given type.
 * Use this in page components and hooks instead of importing
 * directly from catalogData or jerseys/shoes data files.
 */
export function getCatalogProducts(type: 'jersey' | 'shoe'): Product[] {
  return type === 'jersey' ? allJerseys : allShoes
}

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
    if (cat === 'club' || cat === 'club-jerseys' || cat === 'club jerseys') {
      const match = allItemCategories.some((c) => c.includes('club'))
      if (!match) return false
    } else if (cat === 'national' || cat === 'national-jerseys' || cat === 'national-teams' || cat === 'national team jerseys') {
      const match = allItemCategories.some((c) => c.includes('national'))
      if (!match) return false
    } else if (cat === 'retro' || cat === 'retro-jerseys' || cat === 'retro-classic' || cat === 'retro jerseys' || cat === 'retro & classic') {
      const match = allItemCategories.some((c) => c.includes('retro'))
      if (!match) return false
    } else if (cat === 'kids' || cat === 'kids-jerseys' || cat === 'kids jerseys') {
      const match =
        item.name.toLowerCase().includes('kids') ||
        allItemCategories.some((c) => c.includes('kid')) ||
        (item.team && item.team.toLowerCase().includes('kids'))
      if (!match) return false
    } else if (cat === 'special' || cat === 'special-collections' || cat === 'special-editions' || cat === 'limited') {
      const match =
        allItemCategories.some((c) => c.includes('special') || c.includes('limited')) ||
        item.name.toLowerCase().includes('special') ||
        item.name.toLowerCase().includes('heritage') ||
        item.name.toLowerCase().includes('edition') ||
        Boolean(item.isFeatured || item.featured)
      if (!match) return false
    } else if (cat === 'new-season' || cat === 'new-season-jerseys' || cat === 'new season') {
      const match =
        item.name.toLowerCase().includes('2024') ||
        item.name.toLowerCase().includes('24/25') ||
        item.description.toLowerCase().includes('2024') ||
        item.badges?.some((b) => b.toLowerCase().includes('new')) ||
        Boolean(item.isFeatured || item.featured)
      if (!match) return false
    } else if (cat === 'training' || cat === 'training-kits' || cat === 'training-jerseys' || cat === 'training jerseys') {
      const match = allItemCategories.some((c) => c.includes('training')) || item.name.toLowerCase().includes('training')
      if (!match) return false
    } else if (cat === 'matchday' || cat === 'matchday-jerseys') {
      const match =
        allItemCategories.some((c) => c.includes('match')) ||
        item.name.toLowerCase().includes('match') ||
        item.description.toLowerCase().includes('match')
      if (!match) return false
    } else if (cat === 'heritage' || cat === 'heritage-jerseys') {
      const match =
        allItemCategories.some((c) => c.includes('heritage')) ||
        item.name.toLowerCase().includes('heritage') ||
        item.description.toLowerCase().includes('heritage')
      if (!match) return false
    } else if (cat === 'goalkeeper' || cat === 'goalkeeper-jerseys') {
      const match =
        allItemCategories.some((c) => c.includes('keeper') || c.includes('goal')) ||
        item.name.toLowerCase().includes('keeper') ||
        item.description.toLowerCase().includes('keeper')
      if (!match) return false
    } else {
      const normalizedCat = cat.replace(/-jerseys$/, '').replace(/-kits$/, '')
      const match =
        allItemCategories.some((c) => c.includes(cat) || c.includes(normalizedCat)) ||
        item.name.toLowerCase().includes(cat) ||
        item.name.toLowerCase().includes(normalizedCat)
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
    if (cat === 'casual' || cat === 'casual-shoes' || cat === 'casual shoes' || cat === 'urban' || cat === 'urban-casual') {
      if (!allItemCategories.some((c) => c.includes('casual'))) return false
    } else if (cat === 'formal' || cat === 'formal-shoes' || cat === 'formal shoes') {
      if (!allItemCategories.some((c) => c.includes('formal'))) return false
    } else if (cat === 'sneakers' || cat === 'casual-sneakers' || cat === 'shoes-sneakers') {
      if (!allItemCategories.some((c) => c.includes('sneaker'))) return false
    } else if (cat === 'loafers' || cat === 'luxury-loafers' || cat === 'shoes-loafers') {
      if (!allItemCategories.some((c) => c.includes('loafer'))) return false
    } else if (cat === 'leather' || cat === 'leather-shoes' || cat === 'leather-classics' || cat === 'leather classics' || cat === 'shoes-leather') {
      if (!allItemCategories.some((c) => c.includes('leather'))) return false
    } else if (cat === 'new-arrivals' || cat === 'new-arrivals-shoes' || cat === 'shoes-new-arrivals') {
      const isNew =
        Boolean(item.badges?.some((b) => b.toLowerCase().includes('new'))) ||
        Boolean(item.isFeatured || item.featured)
      if (!isNew) return false
    } else if (cat === 'minimalist' || cat === 'minimalist-shoes') {
      const match =
        allItemCategories.some((c) => c.includes('minimal')) ||
        item.name.toLowerCase().includes('minimal') ||
        item.description.toLowerCase().includes('minimal')
      if (!match) return false
    } else if (cat === 'running' || cat === 'running-shoes') {
      const match =
        allItemCategories.some((c) => c.includes('run')) ||
        item.name.toLowerCase().includes('run') ||
        item.description.toLowerCase().includes('run')
      if (!match) return false
    } else if (cat === 'boots') {
      const match =
        allItemCategories.some((c) => c.includes('boot')) ||
        item.name.toLowerCase().includes('boot') ||
        item.description.toLowerCase().includes('boot')
      if (!match) return false
    } else {
      const normalizedCat = cat.replace(/-shoes$/, '')
      if (
        !allItemCategories.some((c) => c.includes(cat) || c.includes(normalizedCat)) &&
        !item.name.toLowerCase().includes(cat) &&
        !item.name.toLowerCase().includes(normalizedCat)
      ) {
        return false
      }
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
 * Combined and deduplicated list of all products across the catalog.
 * Used by search and findProductBySlug.
 */
export const allSearchableProducts: Product[] = allProducts

/**
 * Find single product across both catalog datasets by slug
 */
export function findProductBySlug(slug: string): Product | undefined {
  return getProductBySlug(slug)
}

/**
 * Find single product across both catalog datasets by unique ID
 */
export function findProductById(id: string): Product | undefined {
  return getProductById(id)
}

/**
 * Normalize string for search: lowercase, remove accents, normalize Arabic alef, teh marbuta, etc.
 */
export function normalizeSearchText(text: string): string {
  if (!text) return ''
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[ـ]/g, '')
    .trim()
}

/**
 * Dynamically search products by product names, team names, brands, categories, or keywords.
 * Supports both English and Arabic queries.
 */
export function searchProducts(
  query: string,
  _lang: string = 'en',
  limit: number = 24
): Product[] {
  if (!query || !query.trim()) return []
  const normalizedQuery = normalizeSearchText(query)
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean)
  if (queryTokens.length === 0) return []

  const scored: { product: Product; score: number }[] = []

  for (const product of allSearchableProducts) {
    const nameEn = normalizeSearchText(product.name || '')
    const localizedAr = getLocalizedProduct(product, 'ar')
    const nameAr = normalizeSearchText(localizedAr.name || '')
    const team = normalizeSearchText(product.team || '')
    const brand = normalizeSearchText(product.brand || '')
    const brandOrTeam = normalizeSearchText(product.brandOrTeam || '')
    const categoryEn = normalizeSearchText(product.category || '')
    const categoriesEn = normalizeSearchText((product.categories || []).join(' '))
    const categoryAr = normalizeSearchText(getLocalizedCategory(product.category || '', 'ar'))
    const productType = product.productType
    const productTypeTerms =
      productType === 'jersey'
        ? 'jersey jerseys kit kits shirt shirts football soccer قميص قمصان اطقم طقم'
        : 'shoe shoes sneakers sneaker loafer loafers footwear حذاء احذية جزمة جزم سنيكرز لوفر'
    const color = normalizeSearchText(`${product.color || ''} ${product.colorFamily || ''}`)
    const sku = normalizeSearchText(product.sku || '')
    const desc = normalizeSearchText(product.description || '')

    let aliases = ''
    const teamLower = (product.team || '').toLowerCase()
    const nameLower = (product.name || '').toLowerCase()

    if (teamLower.includes('barcelona') || nameLower.includes('barcelona')) {
      aliases += ' barca barça fcb برشلونة بارسا'
    }
    if (teamLower.includes('real madrid') || nameLower.includes('real madrid')) {
      aliases += ' rm madrid ريال مدريد'
    }
    if (teamLower.includes('manchester') || nameLower.includes('manchester')) {
      aliases += ' mufc man utd manchester united مانشستر يونايتد'
    }
    if (teamLower.includes('paris') || teamLower.includes('psg') || nameLower.includes('psg')) {
      aliases += ' psg paris saint germain باريس سان جيرمان'
    }
    if (teamLower.includes('miami') || nameLower.includes('miami')) {
      aliases += ' miami messi inter miami ميامي ميسي انتر ميامي'
    }
    if (teamLower.includes('nassr') || nameLower.includes('nassr')) {
      aliases += ' nassr ronaldo al nassr النصر رونالدو'
    }
    if (teamLower.includes('milan') || nameLower.includes('milan')) {
      aliases += ' ac milan ميلان اسي ميلان'
    }
    if (teamLower.includes('germany') || nameLower.includes('germany')) {
      aliases += ' germany deutschland المانيا'
    }
    if (teamLower.includes('atlas') || nameLower.includes('atlas')) {
      aliases += ' morocco maroc المغرب اسود الاطلس'
    }
    if (teamLower.includes('azzurri') || nameLower.includes('azzurri')) {
      aliases += ' italy italia ايطاليا ازوري'
    }

    if (product.productType === 'shoe') {
      const catLower = (product.category || '').toLowerCase()
      if (catLower.includes('sneaker') || nameLower.includes('sneaker')) {
        aliases += ' sneakers sneaker سنيكرز'
      }
      if (catLower.includes('loafer') || nameLower.includes('loafer')) {
        aliases += ' loafers loafer لوفر'
      }
      if (
        catLower.includes('formal') ||
        nameLower.includes('oxford') ||
        nameLower.includes('derby') ||
        nameLower.includes('monk')
      ) {
        aliases += ' formal dress shoes كلاسيك رسمي اوكسفورد'
      }
    }

    const normalizedAliases = normalizeSearchText(aliases)
    const corpus = `${nameEn} ${nameAr} ${team} ${brand} ${brandOrTeam} ${categoryEn} ${categoriesEn} ${categoryAr} ${productTypeTerms} ${color} ${sku} ${desc} ${normalizedAliases}`

    const isMatch = queryTokens.every((token) => corpus.includes(token))
    if (!isMatch) continue

    let score = 0
    if (nameEn === normalizedQuery || nameAr === normalizedQuery) {
      score += 150
    } else if (nameEn.startsWith(normalizedQuery) || nameAr.startsWith(normalizedQuery)) {
      score += 100
    } else if (nameEn.includes(normalizedQuery) || nameAr.includes(normalizedQuery)) {
      score += 80
    }

    if (team && (team === normalizedQuery || team.includes(normalizedQuery))) {
      score += 60
    }
    if (brand && (brand === normalizedQuery || brand.includes(normalizedQuery))) {
      score += 50
    }
    if (categoryEn.includes(normalizedQuery) || categoryAr.includes(normalizedQuery)) {
      score += 40
    }

    for (const token of queryTokens) {
      if (nameEn.includes(token) || nameAr.includes(token)) score += 25
      if (team.includes(token)) score += 20
      if (brand.includes(token)) score += 15
      if (categoryEn.includes(token) || categoryAr.includes(token)) score += 10
      if (normalizedAliases.includes(token)) score += 15
    }

    if (product.isFeatured || product.featured) {
      score += 3
    }

    scored.push({ product, score })
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((s) => s.product)
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
    if (lower === 'club' || lower === 'club-jerseys' || lower === 'club jerseys') return 'قمصان الأندية'
    if (lower === 'national' || lower === 'national-jerseys' || lower === 'national-teams' || lower === 'national team jerseys') return 'قمصان المنتخبات'
    if (lower === 'retro' || lower === 'retro-jerseys' || lower === 'retro jerseys' || lower === 'retro & classic' || lower === 'retro-classic') return 'قمصان كلاسيكية'
    if (lower === 'special' || lower === 'special-collections' || lower === 'special collections' || lower === 'special-editions' || lower === 'special editions') return 'مجموعات خاصة'
    if (lower === 'training' || lower === 'training jerseys' || lower === 'training kits' || lower === 'training-kits' || lower === 'training-jerseys') return 'قمصان التدريب'
    if (lower === 'kids' || lower === 'kids jerseys' || lower === 'kids-jerseys') return 'قمصان الأطفال'
    if (lower === 'new-season' || lower === 'new-season-jerseys' || lower === 'new season') return 'الموسم الجديد'
    if (lower === 'matchday' || lower === 'matchday-jerseys') return 'قمصان المباريات'
    if (lower === 'heritage' || lower === 'heritage-jerseys') return 'تراثي'
    if (lower === 'goalkeeper' || lower === 'goalkeeper-jerseys') return 'حراس المرمى'
    if (lower === 'limited') return 'إصدار محدود'
    if (lower === 'sneakers' || lower === 'casual-sneakers') return 'سنيكرز'
    if (lower === 'loafers' || lower === 'luxury-loafers') return 'لوفر'
    if (lower === 'casual' || lower === 'casual-shoes' || lower === 'casual shoes' || lower === 'urban' || lower === 'urban-casual') return 'أحذية كاجوال'
    if (lower === 'formal' || lower === 'formal-shoes' || lower === 'formal shoes') return 'أحذية رسمية'
    if (lower === 'leather' || lower === 'leather classics' || lower === 'leather-classics' || lower === 'leather-shoes') return 'أحذية جلدية'
    if (lower === 'new-arrivals' || lower === 'new-arrivals-shoes' || lower === 'shoes-new-arrivals') return 'وصل حديثاً'
    if (lower === 'minimalist' || lower === 'minimalist-shoes') return 'أحذية مينيمالية'
    if (lower === 'running' || lower === 'running-shoes') return 'أحذية ركض'
    if (lower === 'boots') return 'بوت'
    if (lower === 'track order') return 'تتبع الطلب'
    return category
  }

  const enMap: Record<string, string> = {
    club: 'Club Jerseys',
    'club-jerseys': 'Club Jerseys',
    national: 'National Jerseys',
    'national-jerseys': 'National Jerseys',
    'national-teams': 'National Jerseys',
    retro: 'Retro Jerseys',
    'retro-jerseys': 'Retro Jerseys',
    'retro-classic': 'Retro Jerseys',
    special: 'Special Editions',
    'special-collections': 'Special Editions',
    'special-editions': 'Special Editions',
    kids: 'Kids Jerseys',
    'kids-jerseys': 'Kids Jerseys',
    'new-season': 'New Season',
    'new-season-jerseys': 'New Season',
    matchday: 'Matchday Kits',
    'matchday-jerseys': 'Matchday Kits',
    heritage: 'Heritage Kits',
    'heritage-jerseys': 'Heritage Kits',
    goalkeeper: 'Goalkeeper Jerseys',
    'goalkeeper-jerseys': 'Goalkeeper Jerseys',
    limited: 'Limited Edition',
    training: 'Training Kits',
    'training-kits': 'Training Kits',
    'training-jerseys': 'Training Kits',
    sneakers: 'Sneakers',
    'casual-sneakers': 'Sneakers',
    loafers: 'Loafers',
    'luxury-loafers': 'Loafers',
    casual: 'Casual Shoes',
    'casual-shoes': 'Casual Shoes',
    'urban-casual': 'Casual Shoes',
    formal: 'Formal Shoes',
    'formal-shoes': 'Formal Shoes',
    leather: 'Leather Classics',
    'leather-classics': 'Leather Classics',
    'leather-shoes': 'Leather Classics',
    'new-arrivals': 'New Arrivals',
    'new-arrivals-shoes': 'New Arrivals',
    'shoes-new-arrivals': 'New Arrivals',
    minimalist: 'Minimalist Shoes',
    'minimalist-shoes': 'Minimalist Shoes',
    running: 'Running Shoes',
    'running-shoes': 'Running Shoes',
    boots: 'Boots',
  }
  return enMap[lower] || category
}


