import { jerseyProducts } from './jerseys';
import { shoeProducts } from './shoes';
import type {
  Product,
  JerseyProduct,
  ShoeProduct,
  ProductType,
  JerseyCategory,
  ShoeCategory,
} from '../../types/product';

export { jerseyProducts } from './jerseys';
export { shoeProducts } from './shoes';

// Canonical category product arrays
export const allJerseys: JerseyProduct[] = jerseyProducts;
export const allShoes: ShoeProduct[] = shoeProducts;

/**
 * Combined and deduplicated canonical list of all static product records across categories.
 */
const productMapBySlug = new Map<string, Product>();
const productMapById = new Map<string, Product>();

for (const p of [...allJerseys, ...allShoes]) {
  if (p.slug && !productMapBySlug.has(p.slug)) {
    productMapBySlug.set(p.slug, p);
  }
  if (p.id && !productMapById.has(p.id)) {
    productMapById.set(p.id, p);
  }
  if (p._id && !productMapById.has(p._id)) {
    productMapById.set(p._id, p);
  }
}

export const allProducts: Product[] = Array.from(productMapBySlug.values());

/**
 * Find any product by its slug (O(1) lookup).
 */
export function getProductBySlug(slug: string): Product | undefined {
  return productMapBySlug.get(slug);
}

/**
 * Find any product by its unique ID (O(1) lookup).
 */
export function getProductById(id: string): Product | undefined {
  return productMapById.get(id);
}

/**
 * Retrieve all featured products for hero sections, carousels, or homepage highlights.
 */
export function getFeaturedProducts(): Product[] {
  return allProducts.filter((p) => p.isFeatured || p.featured);
}

/**
 * Filter products by high-level category type ('jersey' | 'shoe').
 */
export function getProductsByType(type: 'jersey'): JerseyProduct[];
export function getProductsByType(type: 'shoe'): ShoeProduct[];
export function getProductsByType(type: ProductType): Product[] {
  if (type === 'jersey') return allJerseys;
  if (type === 'shoe') return allShoes;
  return [];
}

/**
 * Filter products by specific jersey or shoe category string.
 */
export function getProductsByCategory(category: JerseyCategory | ShoeCategory): Product[] {
  return allProducts.filter(
    (p) => p.category === category || (p.categories as string[])?.includes(category)
  );
}
