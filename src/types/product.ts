/**
 * Product domain types and interfaces for the S90 Ecommerce platform.
 * Designed for static dummy data and structured for future Sanity CMS integration.
 */

export type ProductType = 'jersey' | 'shoe';

export type ProductBadge =
  | 'New Arrival'
  | 'Best Seller'
  | 'Sale'
  | 'Featured'
  | 'Limited Edition'
  | 'Trending';

export type JerseyCategory =
  | 'Club jerseys'
  | 'National team jerseys'
  | 'Home jerseys'
  | 'Away jerseys'
  | 'Retro jerseys'
  | 'Training jerseys';

export type ShoeCategory =
  | 'Casual shoes'
  | 'Formal shoes'
  | 'Sneakers'
  | 'Loafers'
  | 'Leather shoes';

export type JerseySize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';

export type ShoeSize = 39 | 40 | 41 | 42 | 43 | 44 | 45;

export type ShoeWidth = 'Narrow (B/C)' | 'Standard (D)' | 'Wide (EE)' | 'Extra Wide (EEE)';

export interface ProductRating {
  rate: number;
  count: number;
}

export interface JerseyVariant {
  id: string;
  sku: string;
  size: JerseySize;
  chestInches: string;
  stockQuantity: number;
  inStock: boolean;
  priceOffset?: number;
}

export interface JerseyCustomizationOptions {
  playerPrintingAvailable: boolean;
  customNameAllowed: boolean;
  customNumberAllowed: boolean;
  patchOptions?: string[];
}

export interface JerseyComparisonImages {
  stadiumImage: string;
  authenticImage: string;
}

export interface ShoeVariant {
  id: string;
  sku: string;
  size: ShoeSize;
  sizeEu: number;
  sizeUs: number;
  sizeUk: number;
  width?: ShoeWidth;
  stockQuantity: number;
  inStock: boolean;
  priceOffset?: number;
}

export interface ShoeConstructionDetails {
  upperMaterial: string;
  liningMaterial: string;
  soleMaterial: string;
  closureType: string;
  constructionMethod?: string;
}

/**
 * Base product attributes shared by all catalog items.
 * Includes Sanity CMS document identifiers (`_id`, `_type`) and standard e-commerce metadata.
 */
export interface BaseProduct {
  id: string;
  _id: string;
  _type: 'jerseyProduct' | 'shoeProduct' | 'product';
  name: string;
  slug: string;
  sku: string;
  productType: ProductType;
  brand: string;
  team?: string;
  brandOrTeam: string;
  description: string;
  shortDescription?: string;
  features?: string[];
  images: string[];
  availableSizes: string[] | number[];
  color: string;
  colorFamily?: string;
  colorHex?: string;
  price: number;
  originalPrice?: number;
  currency: string;
  badges: ProductBadge[];
  stockQuantity: number;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  ratingDetails?: ProductRating;
  isFeatured: boolean;
  featured: boolean;
}

/**
 * Specialized jersey product with apparel-specific sizing, fits, and match kit details.
 */
export interface JerseyProduct extends BaseProduct {
  productType: 'jersey';
  _type: 'jerseyProduct';
  category: JerseyCategory;
  categories: JerseyCategory[];
  team: string;
  availableSizes: JerseySize[];
  variants: JerseyVariant[];
  fit: 'Slim Fit' | 'Regular Fit' | 'Athletic Fit' | 'Relaxed Vintage Fit';
  material: string;
  customization?: JerseyCustomizationOptions;
  comparisonImages?: JerseyComparisonImages;
}

/**
 * Specialized shoe product with footwear sizing conversions (EU, US, UK) and construction specs.
 */
export interface ShoeProduct extends BaseProduct {
  productType: 'shoe';
  _type: 'shoeProduct';
  category: ShoeCategory;
  categories: ShoeCategory[];
  availableSizes: ShoeSize[];
  variants: ShoeVariant[];
  construction: ShoeConstructionDetails;
  fit: 'True to size' | 'Runs small' | 'Runs large';
}

/**
 * Discriminated union of all available product models.
 */
export type Product = JerseyProduct | ShoeProduct;

/**
 * Type guard for jersey products.
 */
export function isJerseyProduct(product: Product): product is JerseyProduct {
  return product.productType === 'jersey';
}

/**
 * Type guard for shoe products.
 */
export function isShoeProduct(product: Product): product is ShoeProduct {
  return product.productType === 'shoe';
}

