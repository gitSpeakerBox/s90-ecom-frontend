import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'
import { useCart } from '../../context/CartContext'
import { useCartDrawer } from '../../context/CartDrawerContext'
import { getLocalizedProduct } from '../../services/productService'
import { formatPrice } from '../../utils/formatters'
import type { Product } from '../../types/product'
import './QuickAddModal.css'

interface QuickAddModalDialogProps {
  product: Product
  onClose: () => void
  modalRef: React.RefObject<HTMLDivElement | null>
}

const QuickAddModalDialog: React.FC<QuickAddModalDialogProps> = ({
  product,
  onClose,
  modalRef,
}) => {
  const { t, language, currency } = useLocale()
  const { addToCart } = useCart()
  const { openCartDrawer } = useCartDrawer()

  const [selectedSize, setSelectedSize] = useState<string | number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [shake, setShake] = useState(false)

  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current)
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
    }
  }, [])

  const localizedProduct = getLocalizedProduct(product, language)

  const sizesList = useMemo(() => {
    const rawSizes =
      product.availableSizes && product.availableSizes.length > 0
        ? product.availableSizes
        : product.variants && product.variants.length > 0
          ? product.variants.map((v) => v.size)
          : []

    const uniqueSizes: (string | number)[] = []
    rawSizes.forEach((sz) => {
      if (!uniqueSizes.some((u) => String(u) === String(sz))) {
        uniqueSizes.push(sz)
      }
    })

    return uniqueSizes.map((size) => {
      const variant = product.variants?.find((v) => String(v.size) === String(size))
      const isOutOfStock = variant
        ? variant.inStock === false ||
          (variant.stockQuantity !== undefined && variant.stockQuantity <= 0)
        : product.inStock === false ||
          (product.stockQuantity !== undefined && product.stockQuantity <= 0)

      return {
        size,
        isOutOfStock: Boolean(isOutOfStock),
      }
    })
  }, [product])

  const hasSizes = sizesList.length > 0

  const isShoe =
    product.productType === 'shoe' || (product as any)._type === 'shoeProduct'
  const fallbackImage = isShoe
    ? '/images/products/shoes/shoes1.png'
    : '/images/hero-jerseys-1.png'
  const displayImage = product.images?.[0] || fallbackImage

  const brandLine = (() => {
    if (product.productType === 'shoe') {
      return localizedProduct.brand || localizedProduct.brandOrTeam || null
    }
    return (
      (localizedProduct as any).team ||
      localizedProduct.brandOrTeam ||
      localizedProduct.brand ||
      null
    )
  })()

  const formattedPrice = formatPrice(product.price, language, currency)
  const formattedOriginalPrice = product.originalPrice
    ? formatPrice(product.originalPrice, language, currency)
    : null

  const handleAddToCart = () => {
    if (hasSizes && !selectedSize) {
      setError(
        t('quickAdd.pleaseSelectSize', { defaultValue: 'Please select a size' })
      )
      setShake(true)
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current)
      shakeTimerRef.current = setTimeout(() => {
        setShake(false)
      }, 400)
      return
    }

    setIsSuccess(true)
    setError(null)

    addToCart({
      productSlug: product.slug,
      size: selectedSize ?? undefined,
      quantity: 1,
      price: product.price,
      name: localizedProduct.name,
      image: displayImage,
      brandOrTeam: brandLine || undefined,
    })

    // change the button to 'Added ✓' for 600ms, then close the modal with the slide-out motion and open cart drawer
    if (successTimerRef.current) clearTimeout(successTimerRef.current)
    successTimerRef.current = setTimeout(() => {
      onClose()
      openCartDrawer()
    }, 600)
  }

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-add-title"
      className="quick-add-modal"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close Button (X) at top-right */}
      <button
        type="button"
        className="quick-add-close-btn"
        onClick={onClose}
        aria-label={t('quickAdd.close', { defaultValue: 'Close' })}
      >
        <X size={18} strokeWidth={1.75} />
      </button>

      <div className="quick-add-content">
        {/* Product Header Row */}
        <div className="quick-add-product-row">
          <div className="quick-add-image-box">
            <img
              src={displayImage}
              alt={localizedProduct.name}
              className="quick-add-image"
              loading="eager"
            />
          </div>
          <div className="quick-add-info">
            {brandLine && <span className="quick-add-brand">{brandLine}</span>}
            <h2 id="quick-add-title" className="quick-add-name">
              {localizedProduct.name}
            </h2>
            <div className="quick-add-price-row">
              <span className="quick-add-price">{formattedPrice}</span>
              {formattedOriginalPrice && (
                <span className="quick-add-original-price">
                  {formattedOriginalPrice}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Sizes Section (hidden if product has no sizes) */}
        {hasSizes && (
          <div className="quick-add-sizes-section">
            <div className="quick-add-sizes-header">
              <span className="quick-add-sizes-label">
                {t('quickAdd.selectSize', { defaultValue: 'Select size' })}
              </span>
              <button
                type="button"
                className="quick-add-size-guide-btn"
                onClick={(e) => e.preventDefault()}
              >
                {t('quickAdd.sizeGuide', { defaultValue: 'Size guide' })}
              </button>
            </div>

            <div
              className="quick-add-size-grid"
              role="group"
              aria-label={t('quickAdd.selectSize', {
                defaultValue: 'Select size',
              })}
            >
              {sizesList.map((item) => {
                const isSelected = selectedSize === item.size
                return (
                  <button
                    key={String(item.size)}
                    type="button"
                    disabled={item.isOutOfStock}
                    className={`quick-add-size-chip ${
                      isSelected ? 'selected' : ''
                    } ${item.isOutOfStock ? 'out-of-stock' : ''}`}
                    onClick={() => {
                      setSelectedSize(item.size)
                      setError(null)
                    }}
                    aria-pressed={isSelected}
                    aria-label={`${item.size}${
                      item.isOutOfStock
                        ? ` (${t('quickAdd.outOfStock', {
                            defaultValue: 'Out of stock',
                          })})`
                        : ''
                    }`}
                  >
                    {String(item.size)}
                  </button>
                )
              })}
            </div>

            {error && (
              <p
                className={`quick-add-error ${shake ? 'quick-add-shake' : ''}`}
                role="alert"
              >
                {error}
              </p>
            )}
          </div>
        )}

        {/* Fallback error if no sizes but error occurred */}
        {!hasSizes && error && (
          <p
            className={`quick-add-error ${shake ? 'quick-add-shake' : ''}`}
            role="alert"
          >
            {error}
          </p>
        )}

        {/* 48px Full-width Dark Submit Button */}
        <div className="quick-add-actions">
          <button
            type="button"
            disabled={isSuccess}
            className={`quick-add-submit-btn ${
              isSuccess ? 'is-success' : ''
            } ${shake ? 'quick-add-shake' : ''}`}
            onClick={handleAddToCart}
          >
            {isSuccess
              ? t('quickAdd.added', { defaultValue: 'Added ✓' })
              : t('quickAdd.addToCart', { defaultValue: 'ADD TO CART' })}
          </button>
        </div>
      </div>
    </div>
  )
}

export const QuickAddModal: React.FC = () => {
  const {
    quickAddProduct,
    isQuickAddOpen,
    quickAddTriggerElement,
    closeQuickAdd,
  } = useCart()

  const [isActive, setIsActive] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const modalRef = useRef<HTMLDivElement | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const shouldRender = (isQuickAddOpen && Boolean(quickAddProduct)) || isClosing

  // Handle slide-out and close animation
  const handleClose = useCallback(() => {
    setIsActive(false)
    setIsClosing(true)

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const duration = prefersReduced ? 200 : 600

    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(() => {
      setIsClosing(false)
      closeQuickAdd()

      // Return focus to trigger button
      if (quickAddTriggerElement) {
        try {
          quickAddTriggerElement.focus()
        } catch {
          // ignore
        }
      }
    }, duration)
  }, [closeQuickAdd, quickAddTriggerElement])

  // Handle open animation
  useEffect(() => {
    if (isQuickAddOpen && quickAddProduct) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)

      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsActive(true)
        })
      })

      return () => cancelAnimationFrame(id)
    }
  }, [isQuickAddOpen, quickAddProduct])

  // Body scroll lock
  useEffect(() => {
    if (!isActive) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isActive])

  // Focus trap and Esc key
  useEffect(() => {
    if (!isActive) return

    // Move initial focus to close button or first actionable element
    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable && focusable.length > 0) {
      focusable[0].focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
        return
      }

      if (e.key === 'Tab') {
        const currentFocusable = modalRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!currentFocusable || currentFocusable.length === 0) return
        const first = currentFocusable[0]
        const last = currentFocusable[currentFocusable.length - 1]

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

  if (!shouldRender || !quickAddProduct || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      className={`quick-add-portal ${isActive ? 'is-active' : ''}`}
      aria-hidden={!isActive}
    >
      {/* Dark overlay backdrop */}
      <div
        className="quick-add-backdrop"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <QuickAddModalDialog
        product={quickAddProduct}
        onClose={handleClose}
        modalRef={modalRef}
      />
    </div>,
    document.body
  )
}
