import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'
import { useCart, type CartItem as CartItemType } from '../../context/CartContext'
import { findProductBySlug, getLocalizedProduct } from '../../services/productService'
import { formatPrice } from '../../utils/formatters'
import { RemoveItemModal } from './RemoveItemModal'
import './CartItem.css'

export interface CartItemProps {
  item: CartItemType
  variant?: 'page' | 'compact'
  onNavigate?: () => void
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  variant = 'page',
  onNavigate,
}) => {
  const { t, language, currency } = useLocale()
  const { updateQuantity, removeFromCart } = useCart()

  const rawProduct = findProductBySlug(item.productSlug)
  const localizedProduct = rawProduct ? getLocalizedProduct(rawProduct, language) : null

  const isShoe =
    rawProduct?.productType === 'shoe' ||
    (rawProduct as { _type?: string } | undefined)?._type === 'shoeProduct' ||
    (typeof item.size === 'number' && item.size >= 35)

  const fallbackImage = isShoe
    ? '/images/products/shoes/shoes1.png'
    : '/images/hero-jerseys-1.png'
  const displayImage = item.image || rawProduct?.images?.[0] || fallbackImage

  const displayName = localizedProduct?.name || item.name || item.productSlug

  const brandLine = (() => {
    if (isShoe) {
      return localizedProduct?.brand || localizedProduct?.brandOrTeam || item.brandOrTeam || ''
    }
    return (
      (localizedProduct as { team?: string } | null)?.team ||
      localizedProduct?.brandOrTeam ||
      localizedProduct?.brand ||
      item.brandOrTeam ||
      ''
    )
  })()

  const sizeVariant = rawProduct?.variants?.find(
    (v) => String(v.size) === String(item.size)
  )

  const sizeChipLabel = (() => {
    if (item.size === undefined || item.size === null || item.size === '') {
      return null
    }
    if (isShoe) {
      const ukVal = (sizeVariant as { sizeUk?: number } | undefined)?.sizeUk ?? item.size
      return t('cart.sizeUk', { size: ukVal, defaultValue: `UK : ${ukVal}` })
    }
    return t('cart.sizeJersey', { size: item.size, defaultValue: `Size : ${item.size}` })
  })()

  const stockLimit =
    sizeVariant?.stockQuantity ?? rawProduct?.stockQuantity ?? 10

  const handleDecrease = () => {
    if (item.quantity > 1) {
      updateQuantity(item.productSlug, item.size, item.quantity - 1)
    }
  }

  const handleIncrease = () => {
    if (item.quantity < stockLimit) {
      updateQuantity(item.productSlug, item.size, item.quantity + 1)
    }
  }

  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false)
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null)

  const handleOpenRemoveModal = (e: React.MouseEvent<HTMLButtonElement>) => {
    setTriggerElement(e.currentTarget)
    setIsRemoveModalOpen(true)
  }

  const handleCancelRemove = () => {
    setIsRemoveModalOpen(false)
  }

  const handleConfirmRemove = () => {
    setIsRemoveModalOpen(false)
    removeFromCart(item.productSlug, item.size)
  }

  const formattedPrice = formatPrice(
    item.price * (item.quantity || 1),
    language,
    currency
  )

  return (
    <div
      className={`cart-item-component ${
        variant === 'compact' ? 'cart-item-component--compact' : ''
      }`}
      role="listitem"
    >
      {/* Left: 100px by 120px Image Box */}
      <Link
        to={`/product/${item.productSlug}`}
        className={`cart-item-thumb-box ${
          isShoe ? 'cart-item-thumb-box--shoe' : 'cart-item-thumb-box--jersey'
        }`}
        onClick={onNavigate}
        aria-label={displayName}
      >
        <img
          src={displayImage}
          alt={displayName}
          className="cart-item-thumb-img"
          loading="lazy"
        />
      </Link>

      {/* Right Column */}
      <div className="cart-item-info-col">
        <div className="cart-item-info-top">
          <div className="cart-item-meta-texts">
            {brandLine ? (
              <span className="cart-item-brand-line">{brandLine}</span>
            ) : null}
            <h3 className="cart-item-title-line">
              <Link
                to={`/product/${item.productSlug}`}
                className="cart-item-title-link"
                onClick={onNavigate}
                title={displayName}
              >
                {displayName}
              </Link>
            </h3>
          </div>

          {/* Remove trash icon at top-right */}
          <button
            type="button"
            className="cart-item-trash-btn"
            onClick={handleOpenRemoveModal}
            aria-label={t('cart.removeItem', { defaultValue: 'Remove item' })}
            title={t('cart.removeItem', { defaultValue: 'Remove item' })}
          >
            <Trash2 size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Price Line */}
        <div className="cart-item-price-line">{formattedPrice}</div>

        {/* Bottom row: Size Chip on left, Stepper on right */}
        <div className="cart-item-controls-row">
          <div className="cart-item-size-container">
            {sizeChipLabel ? (
              <span className="cart-item-size-chip">{sizeChipLabel}</span>
            ) : (
              <span className="cart-item-size-spacer" />
            )}
          </div>

          <div
            className="cart-item-stepper"
            role="group"
            aria-label={t('cart.quantity', { defaultValue: 'Quantity' })}
          >
            <button
              type="button"
              className="cart-item-step-btn"
              onClick={handleDecrease}
              disabled={item.quantity <= 1}
              aria-label={t('cart.decreaseQuantity', {
                defaultValue: 'Decrease quantity',
              })}
            >
              −
            </button>
            <span
              className="cart-item-step-qty"
              aria-live="polite"
              aria-atomic="true"
            >
              {String(item.quantity).padStart(2, '0')}
            </span>
            <button
              type="button"
              className="cart-item-step-btn"
              onClick={handleIncrease}
              disabled={item.quantity >= stockLimit}
              aria-label={t('cart.increaseQuantity', {
                defaultValue: 'Increase quantity',
              })}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {isRemoveModalOpen && (
        <RemoveItemModal
          isOpen={isRemoveModalOpen}
          onCancel={handleCancelRemove}
          onConfirm={handleConfirmRemove}
          triggerElement={triggerElement}
          item={{
            name: displayName,
            image: displayImage,
            size: sizeChipLabel,
            price: formattedPrice,
          }}
        />
      )}
    </div>
  )
}

