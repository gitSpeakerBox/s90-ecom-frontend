import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Trash2, X } from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'
import { useCart, type CartItem as CartItemType } from '../../context/CartContext'
import { findProductBySlug, getLocalizedProduct } from '../../services/productService'
import { formatPrice } from '../../utils/formatters'
import './CartItem.css'

interface RemoveItemModalProps {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
  triggerElement?: HTMLElement | null
  item?: {
    name?: string
    image?: string
    size?: string | null
    price?: string
  }
}

const RemoveItemModal: React.FC<RemoveItemModalProps> = ({
  isOpen,
  onCancel,
  onConfirm,
  triggerElement,
  item,
}) => {
  const { t } = useLocale()
  const [isActive, setIsActive] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const shouldRender = isOpen || isClosing

  // Smooth close handler with animation
  const handleClose = useCallback(() => {
    setIsActive(false)
    setIsClosing(true)

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const duration = prefersReduced ? 0 : 200

    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(() => {
      setIsClosing(false)
      onCancel()

      // Return focus to trigger element if available
      if (triggerElement) {
        try {
          triggerElement.focus()
        } catch {
          // ignore
        }
      }
    }, duration)
  }, [onCancel, triggerElement])

  // Handle confirm
  const handleConfirm = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    setIsActive(false)
    setIsClosing(false)
    onConfirm()
  }, [onConfirm])

  // Trigger enter animation on open
  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsActive(true)
        })
      })
      return () => cancelAnimationFrame(id)
    }
  }, [isOpen])

  // Body scroll lock
  useEffect(() => {
    if (!isActive) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isActive])

  // Keyboard navigation: Escape key to close, Tab trap, and initial focus on Cancel
  useEffect(() => {
    if (!isActive) return

    // Focus cancel button on open for safe keyboard UX
    if (cancelBtnRef.current) {
      cancelBtnRef.current.focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
        return
      }

      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable || focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, handleClose])

  if (!shouldRender || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      className={`remove-item-portal ${isActive ? 'is-active' : ''}`}
      aria-hidden={!isActive}
    >
      {/* Dark overlay backdrop */}
      <div
        className={`remove-item-backdrop ${isActive ? 'is-visible' : ''}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Confirmation Modal Card */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="remove-item-title"
        aria-describedby="remove-item-message"
        className={`remove-item-modal ${isActive ? 'is-open' : ''}`}
      >
        <button
          type="button"
          className="remove-item-close-btn"
          onClick={handleClose}
          aria-label={t('quickAdd.close', { defaultValue: 'Close' })}
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        <div className="remove-item-icon-badge" aria-hidden="true">
          <Trash2 size={22} strokeWidth={1.75} />
        </div>

        <h2 id="remove-item-title" className="remove-item-title">
          {t('cart.removeConfirmTitle', { defaultValue: 'Remove Item?' })}
        </h2>

        <p id="remove-item-message" className="remove-item-message">
          {t('cart.removeConfirmMessage', {
            defaultValue:
              'Are you sure you want to remove this item from your cart?',
          })}
        </p>

        {item && item.name && (
          <div className="remove-item-preview">
            {item.image && (
              <img
                src={item.image}
                alt={item.name}
                className="remove-item-thumb"
              />
            )}
            <div className="remove-item-preview-details">
              <span className="remove-item-preview-name">{item.name}</span>
              <div className="remove-item-preview-meta">
                {item.size && (
                  <span className="remove-item-preview-size">{item.size}</span>
                )}
                {item.price && (
                  <span className="remove-item-preview-price">{item.price}</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="remove-item-actions">
          <button
            ref={cancelBtnRef}
            type="button"
            className="remove-item-btn remove-item-btn-cancel"
            onClick={handleClose}
          >
            {t('cart.cancel', { defaultValue: 'Cancel' })}
          </button>
          <button
            type="button"
            className="remove-item-btn remove-item-btn-confirm"
            onClick={handleConfirm}
          >
            {t('cart.confirmRemove', { defaultValue: 'Yes, Remove' })}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

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
