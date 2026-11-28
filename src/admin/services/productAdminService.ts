import { allProducts, allJerseys, allShoes, registerProduct, moveProductToType } from '../../shared/data/products'
import type {
  Product,
  ProductType,
  JerseyProduct,
  ShoeProduct,
  JerseyCategory,
  JerseyVariant,
  ShoeCategory,
  ShoeVariant,
  ShoeSize,
  JerseySize,
} from '../../shared/types/product'
import { isProductBlocked, setProductBlocked } from '../../shared/services/productAvailability'
import { getBadgeById, getBadgeByName, listBadges } from '../../shared/services/badgeService'
import type { BadgeDefinition } from '../../shared/types/badge'
import { allowsNameNumber, isSizeAvailable, shortsOptionFor } from '../../shared/services/productOptions'
import { arabicProductTranslations } from '../../shared/data/translations'
import { ALL_COLLECTION_CONFIGS } from '../../user/data/collections'
import type { CollectionConfig } from '../../user/data/collections'
import { getLocalizedProduct } from '../../user/services/productService'
import { JERSEY_OPTION_PRICES } from '../../user/constants/jerseyOptions'
import { isCollectionActive } from '../../shared/services/collectionAvailability'
import { collectionName } from './collectionAdminService'
import { slugify } from '../utils/format'

/**
 * Admin adapter over the existing catalog (src/shared/data/products).
 * Reads and edits the very same product objects the storefront renders; new
 * products are registered into the same arrays and lookup maps. Arabic text
 * goes to the existing product translations (shared/data/translations),
 * categories are the Admin Categories (user/data/collections) and badges are
 * the badge records (Admin › Badges). Changes live in memory for the session.
 */

/** Badge names offered in the product form — from the badge registry (Admin › Badges). */
export function productBadgeNames(): string[] {
  return listBadges().map((b) => b.name)
}

export function listProducts(): Product[] {
  return allProducts
}

/** Product-level availability. Blocked products are hidden from the storefront. */
export function isBlocked(product: Product): boolean {
  return isProductBlocked(product)
}

export function setBlocked(product: Product, blocked: boolean): void {
  setProductBlocked(product.id, blocked)
}

export function productTypeLabel(product: Product): 'Jersey' | 'Shoe' {
  return product.productType === 'jersey' ? 'Jersey' : 'Shoe'
}

/** Distinct category labels present on products of a type (Products page filter). */
export function categoriesFor(type: ProductType): string[] {
  const source: Product[] = type === 'jersey' ? allJerseys : allShoes
  const set = new Set<string>()
  for (const p of source) {
    set.add(p.category)
    for (const c of p.categories as string[]) set.add(c)
  }
  return Array.from(set).sort()
}

/* ───────────────────────────── Form options ───────────────────────────── */

export const PRODUCT_TYPE_OPTIONS: { value: ProductType; label: string }[] = [
  { value: 'jersey', label: 'Jersey' },
  { value: 'shoe', label: 'Shoes' },
]

/** Sizes the storefront sells per product type, in display order. */
export const SIZE_OPTIONS: Record<ProductType, string[]> = {
  jersey: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] satisfies JerseySize[],
  shoe: ['39', '40', '41', '42', '43', '44', '45'],
}

export interface CategoryOption {
  value: string
  label: string
  active: boolean
}

/** Admin Categories (Admin › Categories) of a type. */
export function productCategoryOptions(type: ProductType | ''): CategoryOption[] {
  if (!type) return []
  const configs = ALL_COLLECTION_CONFIGS.filter((c) => c.type === type)
  const names = configs.map((c) => collectionName(c, 'en'))
  // Some catalog categories share a name; their URL slug tells them apart.
  return configs.map((c, i) => ({
    value: c.slug,
    label: names.indexOf(names[i]) === names.lastIndexOf(names[i]) ? names[i] : `${names[i]} (${c.slug})`,
    active: isCollectionActive(c.slug),
  }))
}

export function normalBadgeOptions(): BadgeDefinition[] {
  return listBadges('Normal Badge')
}

export function sponsorBadgeOptions(): BadgeDefinition[] {
  return listBadges('Sponsor Badge')
}

/**
 * The Admin Category a product belongs to: the one chosen in the Admin, else
 * the category its catalog data names (e.g. “Club jerseys” → Club Jerseys).
 */
export function productCategorySlug(p: Product): string {
  if (p.categorySlug && ALL_COLLECTION_CONFIGS.some((c) => c.slug === p.categorySlug)) return p.categorySlug
  const configs = ALL_COLLECTION_CONFIGS.filter((c) => c.type === p.productType)
  for (const label of [p.category, ...(p.categories as string[])]) {
    const text = label.toLowerCase()
    const match = configs.find((c) => text.includes(c.category))
    if (match) return match.slug
  }
  return ''
}

/** Arabic text saved for a product (existing translations or Admin edits). */
function arabicEntry(p: Product) {
  return arabicProductTranslations[p.id] ?? arabicProductTranslations[p.slug]
}

/* ───────────────────────────── Form values ───────────────────────────── */

export interface ProductFormValues {
  name: string
  nameAr: string
  type: ProductType | ''
  /** Admin Category slug. */
  category: string
  description: string
  descriptionAr: string
  /** Raw input, validated on save. */
  price: string
  /** Offered sizes. */
  sizes: string[]
  /** Offered sizes customers cannot select. */
  unavailableSizes: string[]
  /** Image sources in display order (paths or uploaded data URLs); the first is the main image. */
  images: string[]
  /** Normal Badge id, or ''. */
  badge: string
  /** Sponsor Badge id, or ''. */
  sponsorBadge: string
  nameNumber: boolean
  shorts: boolean
  shortsPrice: string
}

export type ProductFormErrors = Partial<Record<keyof ProductFormValues, string>>

export function emptyFormValues(): ProductFormValues {
  return {
    name: '',
    nameAr: '',
    type: '',
    category: '',
    description: '',
    descriptionAr: '',
    price: '',
    sizes: [],
    unavailableSizes: [],
    images: [],
    badge: '',
    sponsorBadge: '',
    nameNumber: false,
    shorts: false,
    shortsPrice: '',
  }
}

/** Values for a newly chosen type: every size offered and available, category cleared. */
export function valuesForType(values: ProductFormValues, type: ProductType | ''): ProductFormValues {
  return {
    ...values,
    type,
    category: '',
    sizes: type ? [...SIZE_OPTIONS[type]] : [],
    unavailableSizes: [],
  }
}

function badgeIdsOfType(p: Product, type: BadgeDefinition['type']): string[] {
  return p.badges
    .map((name) => getBadgeByName(name))
    .filter((b): b is BadgeDefinition => Boolean(b && b.type === type))
    .map((b) => b.id)
}

/** Badge names on the product beyond the one Badge and one Sponsor Badge the form edits. */
export function extraBadgeNames(p: Product): string[] {
  const normal = badgeIdsOfType(p, 'Normal Badge')
  const sponsor = badgeIdsOfType(p, 'Sponsor Badge')
  const kept = new Set([normal[0], sponsor[0]].filter(Boolean))
  return p.badges.filter((name) => {
    const b = getBadgeByName(name)
    return !b || !kept.has(b.id)
  })
}

export function toFormValues(p: Product): ProductFormValues {
  const ar = getLocalizedProduct(p, 'ar')
  const sizes = (p.availableSizes as (string | number)[]).map(String)
  const shorts = shortsOptionFor(p)
  return {
    name: p.name,
    nameAr: ar.name !== p.name ? ar.name : '',
    type: p.productType,
    category: productCategorySlug(p),
    description: p.description,
    descriptionAr: arabicEntry(p)?.description ?? '',
    price: String(p.price),
    sizes,
    unavailableSizes: sizes.filter((s) => !isSizeAvailable(p, s)),
    images: [...p.images],
    badge: badgeIdsOfType(p, 'Normal Badge')[0] ?? '',
    sponsorBadge: badgeIdsOfType(p, 'Sponsor Badge')[0] ?? '',
    nameNumber: allowsNameNumber(p),
    shorts: Boolean(shorts),
    shortsPrice: String(shorts?.price ?? (p.productType === 'jersey' ? JERSEY_OPTION_PRICES.shorts : '')),
  }
}

/* ───────────────────────────── Validation ───────────────────────────── */

export const PRODUCT_NAME_MAX = 120
export const MAX_PRODUCT_IMAGES = 8
const ARABIC_LETTERS = /\p{Script=Arabic}/u
const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/

function priceError(raw: string, label: string): string | undefined {
  const value = raw.trim()
  if (!value) return `Enter the ${label}.`
  if (!PRICE_PATTERN.test(value)) return 'Use numbers only, with up to 2 decimals (e.g. 249 or 249.50).'
  const n = Number(value)
  if (!(n > 0)) return 'The price must be greater than 0.'
  if (n > 100_000) return 'The price must be QAR 100,000 or less.'
  return undefined
}

export function validateProduct(v: ProductFormValues): ProductFormErrors {
  const e: ProductFormErrors = {}
  const name = v.name.trim()
  const nameAr = v.nameAr.trim()
  if (!name) e.name = 'Enter the product name in English.'
  else if (name.length > PRODUCT_NAME_MAX) e.name = `Use ${PRODUCT_NAME_MAX} characters or fewer.`
  if (!nameAr) e.nameAr = 'Enter the product name in Arabic.'
  else if (nameAr.length > PRODUCT_NAME_MAX) e.nameAr = `Use ${PRODUCT_NAME_MAX} characters or fewer.`
  else if (!ARABIC_LETTERS.test(nameAr)) e.nameAr = 'Use Arabic characters for the Arabic name.'
  if (v.type !== 'jersey' && v.type !== 'shoe') e.type = 'Choose the product type.'
  else {
    if (!v.category) e.category = 'Choose a category.'
    else if (!productCategoryOptions(v.type).some((c) => c.value === v.category)) e.category = 'Choose a category for this product type.'
    const offered = v.sizes.filter((s) => SIZE_OPTIONS[v.type as ProductType].includes(s))
    if (offered.length === 0) e.sizes = 'Select at least one size.'
    else if (offered.every((s) => v.unavailableSizes.includes(s))) e.sizes = 'At least one selected size must be available.'
  }
  if (v.descriptionAr.trim() && !ARABIC_LETTERS.test(v.descriptionAr)) e.descriptionAr = 'Use Arabic characters for the Arabic description.'
  const price = priceError(v.price, 'price')
  if (price) e.price = price
  if (v.images.length === 0) e.images = 'Add at least one product image.'
  else if (v.images.length > MAX_PRODUCT_IMAGES) e.images = `Use up to ${MAX_PRODUCT_IMAGES} images.`
  if (v.badge && getBadgeById(v.badge)?.type !== 'Normal Badge') e.badge = 'Choose a badge from the list.'
  if (v.sponsorBadge && getBadgeById(v.sponsorBadge)?.type !== 'Sponsor Badge') e.sponsorBadge = 'Choose a sponsor badge from the list.'
  if (v.type === 'jersey' && v.shorts) {
    const shorts = priceError(v.shortsPrice, 'shorts price')
    if (shorts) e.shortsPrice = shorts
  }
  return e
}

export function hasProductErrors(e: ProductFormErrors): boolean {
  return Object.values(e).some(Boolean)
}

/* ───────────────────────────── Save ───────────────────────────── */

const NEW_VARIANT_STOCK = 100 // stock is not managed: sizes are simply available or not

function findTemplateVariant<T extends JerseyVariant | ShoeVariant>(source: Product[], size: string): T | undefined {
  for (const p of source) {
    const v = (p.variants as (JerseyVariant | ShoeVariant)[]).find((x) => String(x.size) === size)
    if (v) return v as T
  }
  return undefined
}

/** One variant per offered size; existing variants (IDs, SKUs) are kept, availability is set per size. */
function buildVariants(p: Product, type: ProductType, offered: string[], unavailable: string[]): JerseyVariant[] | ShoeVariant[] {
  const existing = new Map((p.variants as (JerseyVariant | ShoeVariant)[]).map((v) => [String(v.size), v]))
  const sameType = p.productType === type
  if (type === 'jersey') {
    return offered.map((size): JerseyVariant => {
      const own = sameType ? (existing.get(size) as JerseyVariant | undefined) : undefined
      const inStock = !unavailable.includes(size)
      if (own) return { ...own, inStock }
      const t = findTemplateVariant<JerseyVariant>(allJerseys, size)
      return { id: `${p.id}-${size.toLowerCase()}`, sku: `${p.sku}-${size}`, size: size as JerseySize, chestInches: t?.chestInches ?? '', stockQuantity: NEW_VARIANT_STOCK, inStock }
    })
  }
  return offered.map((size): ShoeVariant => {
    const own = sameType ? (existing.get(size) as ShoeVariant | undefined) : undefined
    const inStock = !unavailable.includes(size)
    if (own) return { ...own, inStock }
    const t = findTemplateVariant<ShoeVariant>(allShoes, size)
    const n = Number(size) as ShoeSize
    return { id: `${p.id}-${size}`, sku: `${p.sku}-${size}`, size: n, sizeEu: n, sizeUs: t?.sizeUs ?? n - 32.5, sizeUk: t?.sizeUk ?? n - 33.5, ...(t?.width ? { width: t.width } : {}), stockQuantity: NEW_VARIANT_STOCK, inStock }
  })
}

/** Switches the type-specific fields (jersey ↔ shoes); ID, slug, SKU and references stay. */
function convertType(p: Product, type: ProductType): void {
  if (p.productType === type) return
  const record = p as unknown as Record<string, unknown>
  if (type === 'shoe') {
    for (const key of ['team', 'material', 'customization', 'comparisonImages', 'shorts']) delete record[key]
    Object.assign(record, {
      productType: 'shoe',
      _type: 'shoeProduct',
      construction: { upperMaterial: '', liningMaterial: '', soleMaterial: '', closureType: '' },
      fit: 'True to size',
    })
  } else {
    delete record.construction
    Object.assign(record, { productType: 'jersey', _type: 'jerseyProduct', team: p.brandOrTeam, material: '', fit: 'Regular Fit' })
  }
  moveProductToType(p, type)
}

function applyCategory(p: Product, config: CollectionConfig): void {
  const label = collectionName(config, 'en') || config.slug
  p.categorySlug = config.slug
  ;(p as { category: string }).category = label
  ;(p as { categories: string[] }).categories = [label]
}

/** Writes all form values onto the product object (shared by create and edit). */
function applyValues(p: Product, v: ProductFormValues): void {
  const type = v.type as ProductType
  const typeChanged = p.productType !== type
  const offered = SIZE_OPTIONS[type].filter((s) => v.sizes.includes(s))
  const unavailable = offered.filter((s) => v.unavailableSizes.includes(s))
  const config = ALL_COLLECTION_CONFIGS.find((c) => c.slug === v.category)
  const categoryChanged = typeChanged || productCategorySlug(p) !== v.category

  // Arabic: read the current localized text before anything changes.
  const before = getLocalizedProduct(p, 'ar')
  const previous = arabicEntry(p)

  const variants = buildVariants(p, type, offered, unavailable)
  if (typeChanged) convertType(p, type)

  p.name = v.name.trim()
  p.description = v.description.trim()
  p.price = Math.round(Number(v.price) * 100) / 100
  p.images = [...v.images]
  ;(p as { availableSizes: (string | number)[] }).availableSizes = type === 'shoe' ? offered.map(Number) : offered
  ;(p as { variants: (JerseyVariant | ShoeVariant)[] }).variants = variants
  if (config && categoryChanged) applyCategory(p, config)

  // Badges: the chosen Normal Badge and Sponsor Badge, referenced by name (no new records).
  p.badges = [getBadgeById(v.badge)?.name, getBadgeById(v.sponsorBadge)?.name].filter((n): n is string => Boolean(n))

  if (p.productType === 'jersey') {
    p.customization = {
      ...(p.customization ?? { patchOptions: [] }),
      playerPrintingAvailable: v.nameNumber,
      customNameAllowed: v.nameNumber,
      customNumberAllowed: v.nameNumber,
    }
    p.shorts = { enabled: v.shorts, price: v.shorts ? Math.round(Number(v.shortsPrice) * 100) / 100 : (p.shorts?.price ?? JERSEY_OPTION_PRICES.shorts) }
  }

  const descriptionAr = v.descriptionAr.trim()
  arabicProductTranslations[p.id] = {
    name: v.nameAr.trim(),
    category: config && categoryChanged ? collectionName(config, 'ar') || before.category : (previous?.category ?? before.category),
    ...(descriptionAr ? { description: descriptionAr } : {}),
  }
}

/** Saves form values to an existing catalog product, in place (ID, slug and SKU unchanged). */
export function updateProduct(p: Product, v: ProductFormValues): void {
  applyValues(p, v)
}

function uniqueSlug(name: string): string {
  const base = slugify(name) || 'product'
  let slug = base
  let i = 2
  while (allProducts.some((p) => p.slug === slug || p.id === `adm-${slug}`)) slug = `${base}-${i++}`
  return slug
}

function uniqueSku(slug: string): string {
  const base = `ADM-${slug.toUpperCase().slice(0, 40)}`
  let sku = base
  let i = 2
  while (allProducts.some((p) => p.sku.toLowerCase() === sku.toLowerCase())) sku = `${base}-${i++}`
  return sku
}

/** Creates a product from the form and registers it in the live catalog. */
export function createProduct(v: ProductFormValues): Product {
  const type = v.type as ProductType
  const slug = uniqueSlug(v.name)
  const id = `adm-${slug}`
  const base = {
    id,
    _id: id,
    name: v.name.trim(),
    slug,
    sku: uniqueSku(slug),
    brand: '',
    brandOrTeam: '',
    description: '',
    images: [] as string[],
    color: '',
    price: 0,
    currency: 'QAR',
    badges: [] as string[],
    stockQuantity: NEW_VARIANT_STOCK,
    inStock: true,
    rating: 0,
    reviewCount: 0,
    isFeatured: false,
    featured: false,
  }
  const product: Product =
    type === 'jersey'
      ? ({
          ...base,
          _type: 'jerseyProduct',
          productType: 'jersey',
          team: '',
          category: '' as JerseyCategory,
          categories: [],
          availableSizes: [],
          variants: [],
          fit: 'Regular Fit',
          material: '',
          customization: { playerPrintingAvailable: false, customNameAllowed: false, customNumberAllowed: false, patchOptions: [] },
        } satisfies JerseyProduct)
      : ({
          ...base,
          _type: 'shoeProduct',
          productType: 'shoe',
          category: '' as ShoeCategory,
          categories: [],
          availableSizes: [],
          variants: [],
          construction: { upperMaterial: '', liningMaterial: '', soleMaterial: '', closureType: '' },
          fit: 'True to size',
        } satisfies ShoeProduct)
  applyValues(product, v)
  registerProduct(product)
  return product
}

/** True for products created in the Admin during this session. */
export function isAdminCreated(p: Product): boolean {
  return p.id.startsWith('adm-')
}
