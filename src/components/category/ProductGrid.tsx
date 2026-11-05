import React from 'react'
import { useLocale } from '../../context/LocaleContext'
import type { Product } from '../../types/product'
import { ProductCard } from './ProductCard'
import './ProductGrid.css'

export interface ProductGridProps {
  products: Product[]
  emptyMessage?: string
  onClearAll?: () => void
  isWishlistPage?: boolean
  onRemoveFromWishlist?: (product: Product) => void
  removingSlugs?: Set<string>
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  emptyMessage,
  onClearAll,
  isWishlistPage = false,
  onRemoveFromWishlist,
  removingSlugs,
}) => {
  const { t } = useLocale()
  const resolvedEmptyMessage = emptyMessage || t('filters.emptyMessage')

  if (products.length === 0) {
    return (
      <div className="product-grid-empty">
        <p className="product-grid-empty-text">{resolvedEmptyMessage}</p>
        {onClearAll && (
          <button
            type="button"
            className="product-grid-empty-clear-btn"
            onClick={onClearAll}
          >
            {t('filters.clearAll')}
          </button>
        )}
      </div>
    )
  }

  return (
    <section className="product-grid-section" aria-label={t('common.products')}>
      <div className="product-grid-wrapper">
        <div className="product-grid-container">
          {products.map((product) => (
            <ProductCard
              key={product.id || product._id || product.slug}
              product={product}
              isWishlistPage={isWishlistPage}
              onRemoveFromWishlist={onRemoveFromWishlist}
              isRemoving={removingSlugs ? removingSlugs.has(product.slug) : false}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
