import { allProducts, allJerseys, allShoes, registerProduct } from '../../shared/data/products'
import type {
  Product,
  ProductBadge,
  JerseyProduct,
  ShoeProduct,
  JerseyCategory,
  ShoeCategory,
} from '../../shared/types/product'
import { isProductBlocked, setProductBlocked } from '../../shared/services/productAvailability'
import { listBadges } from '../../shared/services/badgeService'
import { slugify } from '../utils/format'

/**
 * Admin adapter over the existing catalog (src/shared/data/products).
 * Reads and edits the very same product objects the storefront renders; new
 * products are registered into the same arrays and lookup maps. Changes live
 * in memory for the current session only.
 */

/** Badge names offered in the product form — from the badge registry (Admin › Badges). */
export function productBadgeNames(): ProductBadge[] {
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

/** Distinct categories present in the existing catalog data for a product type. */
export function categoriesFor(type: 'jersey' | 'shoe'): string[] {
  const source: Product[] = type === 'jersey' ? allJerseys : allShoes
  const set = new Set<string>()
  for (const p of source) {
    set.add(p.category)
    for (const c of p.categories as string[]) set.add(c)
  }
  return Array.from(set).sort()
}

export interface ProductFormValues {
  type: 'jersey' | 'shoe'
  name: string
  sku: string
  brandOrTeam: string
  category: string
  price: number
  originalPrice: number | null
  image: string
  badges: ProductBadge[]
  featured: boolean
  description: string
  material: string
}

export function toFormValues(p: Product): ProductFormValues {
  return {
    type: p.productType,
    name: p.name,
    sku: p.sku,
    brandOrTeam: p.brandOrTeam,
    category: p.category,
    price: p.price,
    originalPrice: p.originalPrice ?? null,
    image: p.images[0] ?? '',
    badges: [...p.badges],
    featured: Boolean(p.isFeatured || p.featured),
    description: p.description,
    material: p.productType === 'jersey' ? p.material : p.construction.upperMaterial,
  }
}

export function emptyFormValues(type: 'jersey' | 'shoe'): ProductFormValues {
  return {
    type,
    name: '',
    sku: '',
    brandOrTeam: '',
    category: categoriesFor(type)[0] ?? '',
    price: 0,
    originalPrice: null,
    image: '',
    badges: [],
    featured: false,
    description: '',
    material: '',
  }
}

export function validateProduct(values: ProductFormValues, editing?: Product): string[] {
  const errors: string[] = []
  if (!values.name.trim()) errors.push('Product name is required.')
  if (!values.sku.trim()) errors.push('SKU is required.')
  if (!values.category) errors.push('Category is required.')
  if (!values.image.trim()) errors.push('Choose a product image.')
  if (!(values.price > 0)) errors.push('Price must be greater than zero.')
  if (values.originalPrice !== null && values.originalPrice <= values.price) {
    errors.push('Compare-at price must be higher than the selling price.')
  }
  const sku = values.sku.trim().toLowerCase()
  const clash = allProducts.find((p) => p.sku.toLowerCase() === sku && p !== editing)
  if (clash) errors.push(`SKU is already used by “${clash.name}”.`)
  return errors
}

function applyCategory(p: Product, category: string): void {
  const previous = p.category
  const cats = (p.categories as string[]).filter((c) => c !== previous && c !== category)
  ;(p as { category: string }).category = category
  ;(p as { categories: string[] }).categories = [category, ...cats]
}

/** Applies form values to an existing catalog product in place. */
export function updateProduct(p: Product, v: ProductFormValues): void {
  p.name = v.name.trim()
  p.sku = v.sku.trim()
  p.brandOrTeam = v.brandOrTeam.trim()
  if (p.productType === 'jersey') {
    p.team = v.brandOrTeam.trim()
    p.material = v.material.trim() || p.material
  } else {
    p.brand = v.brandOrTeam.trim() || p.brand
    p.construction = { ...p.construction, upperMaterial: v.material.trim() || p.construction.upperMaterial }
  }
  applyCategory(p, v.category)
  p.price = v.price
  p.originalPrice = v.originalPrice ?? undefined
  p.badges = [...v.badges]
  p.isFeatured = v.featured
  p.featured = v.featured
  p.description = v.description.trim()
  p.images = [v.image.trim(), ...p.images.slice(1).filter((img) => img !== v.image.trim())]
}

function uniqueSlug(name: string): string {
  const base = slugify(name) || 'product'
  let slug = base
  let i = 2
  while (allProducts.some((p) => p.slug === slug)) slug = `${base}-${i++}`
  return slug
}

/**
 * Creates a product and registers it in the live catalog. Size and variant
 * structure is copied from the first existing product of the same type so the
 * storefront's size selectors keep working. Stock is not managed in the admin:
 * the stock fields the storefront still reads are copied from that template so
 * new products behave like existing ones (always available unless blocked).
 */
export function createProduct(v: ProductFormValues): Product {
  const slug = uniqueSlug(v.name)
  const id = `adm-${slug}`
  const base = {
    id,
    _id: id,
    name: v.name.trim(),
    slug,
    sku: v.sku.trim(),
    brandOrTeam: v.brandOrTeam.trim(),
    description: v.description.trim(),
    images: [v.image.trim()],
    color: '',
    price: v.price,
    originalPrice: v.originalPrice ?? undefined,
    currency: 'QAR',
    badges: [...v.badges],
    rating: 0,
    reviewCount: 0,
    isFeatured: v.featured,
    featured: v.featured,
  }

  let product: Product
  if (v.type === 'jersey') {
    const template = allJerseys[0]
    const jersey: JerseyProduct = {
      ...base,
      stockQuantity: template.stockQuantity,
      inStock: true,
      _type: 'jerseyProduct',
      productType: 'jersey',
      brand: v.brandOrTeam.trim(),
      team: v.brandOrTeam.trim(),
      category: v.category as JerseyCategory,
      categories: [v.category as JerseyCategory],
      availableSizes: [...template.availableSizes],
      variants: template.variants.map((tv) => ({
        id: `${id}-${tv.size}`,
        sku: `${base.sku}-${tv.size}`,
        size: tv.size,
        chestInches: tv.chestInches,
        stockQuantity: tv.stockQuantity,
        inStock: tv.inStock,
      })),
      fit: 'Regular Fit',
      material: v.material.trim() || 'Not specified',
    }
    product = jersey
  } else {
    const template = allShoes[0]
    const shoe: ShoeProduct = {
      ...base,
      stockQuantity: template.stockQuantity,
      inStock: true,
      _type: 'shoeProduct',
      productType: 'shoe',
      brand: v.brandOrTeam.trim(),
      category: v.category as ShoeCategory,
      categories: [v.category as ShoeCategory],
      availableSizes: [...template.availableSizes],
      variants: template.variants.map((tv) => ({
        id: `${id}-${tv.size}`,
        sku: `${base.sku}-${tv.size}`,
        size: tv.size,
        sizeEu: tv.sizeEu,
        sizeUs: tv.sizeUs,
        sizeUk: tv.sizeUk,
        width: tv.width,
        stockQuantity: tv.stockQuantity,
        inStock: tv.inStock,
      })),
      construction: {
        upperMaterial: v.material.trim() || 'Not specified',
        liningMaterial: 'Not specified',
        soleMaterial: 'Not specified',
        closureType: 'Not specified',
      },
      fit: 'True to size',
    }
    product = shoe
  }
  registerProduct(product)
  return product
}

/** True for products created in the Admin during this session. */
export function isAdminCreated(p: Product): boolean {
  return p.id.startsWith('adm-')
}
