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

/**
 * Combined list of all static dummy products across categories.
 */
export const allProducts: Product[] = [...jerseyProducts, ...shoeProducts];

/**
 * Find any product by its slug.
 */
export function getProductBySlug(slug: string): Product | undefined {
  return allProducts.find((p) => p.slug === slug);
}

/**
 * Find any product by its unique ID.
 */
export function getProductById(id: string): Product | undefined {
  return allProducts.find((p) => p.id === id || p._id === id);
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
  if (type === 'jersey') return jerseyProducts;
  if (type === 'shoe') return shoeProducts;
  return [];
}

/**
 * Filter products by specific jersey or shoe category string.
 */
export function getProductsByCategory(category: JerseyCategory | ShoeCategory): Product[] {
  return allProducts.filter(
    (p) => p.category === category || (p.categories as string[]).includes(category)
  );
}

