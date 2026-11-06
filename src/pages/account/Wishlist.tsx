import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'
import { useWishlist } from '../../context/WishlistContext'
import { ProductCard } from '../../components/products/ProductCard'
import { Pagination } from '../../components/products/Pagination'
import { findProductBySlug } from '../../services/productService'
import type { Product } from '../../types/product'
import '../../components/products/ProductGrid.css'
import './Wishlist.css'

const ITEMS_PER_PAGE = 12

export const Wishlist: React.FC = () => {
  const { t } = useLocale()
  const { items: wishlistSlugs, removeFromWishlist, removeEntry } = useWishlist()
  const [searchParams, setSearchParams] = useSearchParams()

  // Track items fading/collapsing (200ms)
  const [removingSlugs, setRemovingSlugs] = useState<Set<string>>(new Set())
  const [fadingProducts, setFadingProducts] = useState<Map<string, Product>>(new Map())

  // Resolve dummy products by slug. Purge any entries whose product no longer exists.
  const resolvedProducts = useMemo(() => {
    return wishlistSlugs
      .map((slug) => findProductBySlug(slug))
      .filter((p): p is Product => Boolean(p))
  }, [wishlistSlugs])

  useEffect(() => {
    const invalidSlugs = wishlistSlugs.filter((slug) => !findProductBySlug(slug))
    if (invalidSlugs.length > 0) {
      invalidSlugs.forEach((slug) => removeEntry(slug))
    }
  }, [wishlistSlugs, removeEntry])

  // Products to render: active products + any currently fading out over 200ms
  const displayProducts = useMemo(() => {
    const list = [...resolvedProducts]
    fadingProducts.forEach((prod, slug) => {
      if (removingSlugs.has(slug) && !list.some((p) => p.slug === slug)) {
        list.push(prod)
      }
    })
    return list
  }, [resolvedProducts, fadingProducts, removingSlugs])

  // Active items count (reflects immediate removal for badge & heading count)
  const activeCount = resolvedProducts.length

  // Pagination with URL query parameter ?page=2
  const rawPage = parseInt(searchParams.get('page') || '1', 10)
  const totalPages = Math.ceil(activeCount / ITEMS_PER_PAGE)
  const currentPage =
    isNaN(rawPage) || rawPage < 1
      ? 1
      : totalPages > 0 && rawPage > totalPages
        ? totalPages
        : rawPage

  // Sync URL if page exceeds totalPages when items are removed
  useEffect(() => {
    if (totalPages > 0 && rawPage > totalPages) {
      const nextParams = new URLSearchParams(searchParams)
      if (totalPages === 1) {
        nextParams.delete('page')
      } else {
        nextParams.set('page', String(totalPages))
      }
      setSearchParams(nextParams, { replace: true })
    }
  }, [rawPage, totalPages, searchParams, setSearchParams])

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return displayProducts.slice(start, start + ITEMS_PER_PAGE)
  }, [displayProducts, currentPage])

  const handlePageChange = (newPage: number) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('page', String(newPage))
    setSearchParams(nextParams)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRemove = useCallback(
    (product: Product) => {
      // 1. Mark as fading
      setRemovingSlugs((prev) => new Set(prev).add(product.slug))
      setFadingProducts((prev) => new Map(prev).set(product.slug, product))

      // 2. Remove immediately from wishlist context (badge & storage update immediately)
      removeFromWishlist(product.slug)

      // 3. Complete 200ms fade animation and unmount
      setTimeout(() => {
        setRemovingSlugs((prev) => {
          const next = new Set(prev)
          next.delete(product.slug)
          return next
        })
        setFadingProducts((prev) => {
          const next = new Map(prev)
          next.delete(product.slug)
          return next
        })
      }, 200)
    },
    [removeFromWishlist]
  )

  const isEmpty = activeCount === 0 && removingSlugs.size === 0

  return (
    <div className="wishlist-page">
      <div className="wishlist-container">
        {/* Title row with headline serif 32px and item count */}
        <div className="wishlist-header-row">
          <div className="wishlist-title-wrap">
            <h1 className="wishlist-title">
              {t('wishlist.title', { defaultValue: 'My Wishlist' })}
            </h1>
            <span className="wishlist-count">
              {t(
                activeCount === 1
                  ? 'wishlist.itemCount_one'
                  : 'wishlist.itemCount_other',
                {
                  count: activeCount,
                  defaultValue: `${activeCount} ${activeCount === 1 ? 'item' : 'items'}`,
                }
              )}
            </span>
          </div>
        </div>

        {/* 1px divider under heading row */}
        <hr className="wishlist-divider" />

        {isEmpty ? (
          /* Empty state */
          <div className="wishlist-empty-state" role="status">
            <div className="wishlist-empty-icon-wrap" aria-hidden="true">
              <Heart size={64} strokeWidth={1.2} fill="none" />
            </div>
            <h2 className="wishlist-empty-title">
              {t('wishlist.emptyTitle', { defaultValue: 'Your wishlist is empty' })}
            </h2>
            <p className="wishlist-empty-desc">
              {t('wishlist.emptyDesc', {
                defaultValue: 'Save items you love and find them here later.',
              })}
            </p>
            <div className="wishlist-empty-actions">
              <Link to="/jerseys" className="wishlist-empty-btn">
                {t('wishlist.shopJerseys', { defaultValue: 'Shop Jerseys' })}
              </Link>
              <Link to="/shoes" className="wishlist-empty-btn">
                {t('wishlist.shopShoes', { defaultValue: 'Shop Shoes' })}
              </Link>
            </div>
          </div>
        ) : (
          /* Product Grid: 4 columns desktop, 3 tablet, 2 mobile */
          <>
            <div className="product-grid-container">
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product.id || product._id || product.slug}
                  product={product}
                  isWishlistPage={true}
                  isRemoving={removingSlugs.has(product.slug)}
                  onRemoveFromWishlist={handleRemove}
                />
              ))}
            </div>

            {/* Pagination: hidden when 12 or fewer items */}
            {totalPages > 1 && (
              <div className="wishlist-pagination-wrap">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
