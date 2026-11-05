import React, { useState, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Image as ImageIcon, Plus, Trash2 } from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { getLocalizedProduct } from '../../services/productService'
import { formatPrice } from '../../utils/formatters'
import type { Product } from '../../types/product'
import './ProductCard.css'

export interface ProductCardProps {
  product: Product
  isWishlistPage?: boolean
  onRemoveFromWishlist?: (product: Product) => void
  isRemoving?: boolean
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlistPage = false,
  onRemoveFromWishlist,
  isRemoving = false,
}) => {
  const { t, language, currency } = useLocale()
  const { openQuickAdd } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const quickAddBtnRef = useRef<HTMLButtonElement | null>(null)
  const fullWidthAddBtnRef = useRef<HTMLButtonElement | null>(null)
  const [imgError, setImgError] = useState(false)

  const isWishlisted = isInWishlist(product.slug)

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product.slug)
  }

  const handleRemoveWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onRemoveFromWishlist?.(product)
  }

  const handleQuickAddClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    openQuickAdd(product, quickAddBtnRef.current)
  }

  const handleFullWidthAddClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    openQuickAdd(product, fullWidthAddBtnRef.current)
  }

  const isAllOutOfStock = useMemo(() => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.every(
        (v) =>
          v.inStock === false ||
          (v.stockQuantity !== undefined && v.stockQuantity <= 0)
      )
    }
    if (product.availableSizes && product.availableSizes.length > 0) {
      return (
        product.inStock === false ||
        (product.stockQuantity !== undefined && product.stockQuantity <= 0)
      )
    }
    return (
      product.inStock === false ||
      (product.stockQuantity !== undefined && product.stockQuantity <= 0)
    )
  }, [product])

  const localizedProduct = getLocalizedProduct(product, language)

  // Overlay badge: only show when product has a badge (New Arrival / Best Seller / Sale / etc.)
  const getOverlayBadgeLabel = (): string | null => {
    if (product.badges && product.badges.length > 0) {
      const b = product.badges[0]
      const lower = b.toLowerCase()
      if (lower === 'new arrival') return t('productCard.badge.newArrival')
      if (lower === 'best seller') return t('productCard.badge.bestSeller')
      if (lower === 'sale') return t('productCard.badge.sale')
      if (lower === 'limited edition') return t('productCard.badge.limitedEdition')
      if (lower === 'trending') return t('productCard.badge.trending')
      return b.toUpperCase()
    }
    return null
  }

  const overlayBadge = getOverlayBadgeLabel()

  // Line 1: brand (shoes) or team (jerseys) or brandOrTeam fallback
  const brandLine = (() => {
    if (product.productType === 'shoe') {
      return localizedProduct.brand || localizedProduct.brandOrTeam || null
    }
    // Jersey: prefer team, fallback to brandOrTeam
    return (localizedProduct as any).team || localizedProduct.brandOrTeam || localizedProduct.brand || null
  })()

  const formattedPrice = formatPrice(product.price, language, currency)
  const formattedOriginalPrice = product.originalPrice
    ? formatPrice(product.originalPrice, language, currency)
    : null

  // Discount percentage text – only when originalPrice > price
  const discountText = (() => {
    if (product.originalPrice && product.originalPrice > product.price) {
      const pct = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      return `${pct}% Off`
    }
    return null
  })()

  const isShoe = product.productType === 'shoe' || (product as any)._type === 'shoeProduct'
  const fallbackImage = isShoe ? '/images/products/shoes/shoes1.png' : '/images/hero-jerseys-1.png'
  const displayImage = product.images?.[0] || fallbackImage

  const [prevImage, setPrevImage] = useState(displayImage)
  if (prevImage !== displayImage) {
    setPrevImage(displayImage)
    setImgError(false)
  }

  return (
    <article className={`product-card ${isRemoving ? 'product-card-removing' : ''}`} aria-label={localizedProduct.name}>
      <div className="product-card-image-wrapper">
        <Link
          to={`/product/${product.slug}`}
          className="product-card-link-hitbox"
          aria-label={t('productCard.viewProduct', { name: localizedProduct.name })}
        >
          {imgError ? (
            /* Neutral placeholder – same box, same bg, small icon */
            <span className="product-card-placeholder" aria-hidden="true">
              <ImageIcon size={40} strokeWidth={1} />
            </span>
          ) : (
            <img
              src={displayImage}
              alt={localizedProduct.name}
              className="product-card-image"
              /* Prevent layout shift */
              width={800}
              height={800}
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
            />
          )}
        </Link>

        {/* Overlay badge – top-left, inside image */}
        {overlayBadge && (
          <span className="product-card-overlay-badge" aria-label={overlayBadge}>
            {overlayBadge}
          </span>
        )}

        {/* Wishlist button: Heart on catalog pages, Trash2 on Wishlist page */}
        {isWishlistPage ? (
          <button
            type="button"
            className="product-card-remove-wishlist-btn"
            onClick={handleRemoveWishlistClick}
            aria-label={t('wishlist.removeFromWishlist', { defaultValue: 'Remove from wishlist' })}
            title={t('wishlist.removeFromWishlist', { defaultValue: 'Remove from wishlist' })}
          >
            <Trash2 size={16} strokeWidth={1.8} />
          </button>
        ) : (
          <button
            type="button"
            className={`product-card-heart-btn ${isWishlisted ? 'wishlisted' : ''}`}
            onClick={handleHeartClick}
            aria-label={isWishlisted ? t('productCard.removeFromWishlist') : t('productCard.addToWishlist')}
            title={isWishlisted ? t('productCard.removeFromWishlist') : t('productCard.addToWishlist')}
          >
            <Heart
              size={16}
              strokeWidth={1.4}
              className="product-card-heart-icon"
              fill={isWishlisted ? '#111111' : 'none'}
            />
          </button>
        )}

        {/* Quick Add to Cart button – bottom-right, rounded-square button (hidden on wishlist page) */}
        {!isWishlistPage && (
          <button
            ref={quickAddBtnRef}
            type="button"
            className="product-card-quick-add-btn"
            onClick={handleQuickAddClick}
            aria-label={t('quickAdd.cardButtonAria', { defaultValue: 'Add to cart' })}
            title={t('quickAdd.cardButtonAria', { defaultValue: 'Add to cart' })}
          >
            <Plus size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="product-card-details">
        {/* Line 1: brand/team */}
        {brandLine && (
          <span className="product-card-brand">{brandLine}</span>
        )}

        {/* Line 2: product name */}
        <h2 className="product-card-name">
          <Link to={`/product/${product.slug}`} className="product-card-title-link">
            {localizedProduct.name}
          </Link>
        </h2>

        {/* Line 3: price, original price (struck), discount text */}
        <div className="product-card-price-row">
          <span className="product-card-price">{formattedPrice}</span>
          {formattedOriginalPrice && (
            <span className="product-card-original-price">{formattedOriginalPrice}</span>
          )}
          {discountText && (
            <span className="product-card-discount-text">{discountText}</span>
          )}
        </div>

        {/* Line 4 (wishlist page only): Add to cart / Out of stock button */}
        {isWishlistPage && (
          <div className="product-card-wishlist-action">
            {isAllOutOfStock ? (
              <button
                type="button"
                className="product-card-action-btn product-card-action-btn-disabled"
                disabled
                aria-disabled="true"
              >
                {t('wishlist.outOfStock', { defaultValue: 'OUT OF STOCK' })}
              </button>
            ) : (
              <button
                ref={fullWidthAddBtnRef}
                type="button"
                className="product-card-action-btn"
                onClick={handleFullWidthAddClick}
                aria-label={t('wishlist.addToCart', { defaultValue: 'ADD TO CART' })}
              >
                {t('wishlist.addToCart', { defaultValue: 'ADD TO CART' })}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
