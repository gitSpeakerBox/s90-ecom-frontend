import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, X } from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'
import { useCart } from '../../context/CartContext'
import { useCartDrawer } from '../../context/CartDrawerContext'
import { CartItem } from './CartItem'
import { CartTotalsBlock } from './CartTotalsBlock'
import './CartDrawer.css'

export interface CartEmptyStateProps {
  onActionClick?: () => void
}

export const CartEmptyState: React.FC<CartEmptyStateProps> = ({
  onActionClick,
}) => {
  const { t } = useLocale()

  return (
    <div className="cart-empty-state">
      <div className="cart-empty-icon-wrap" aria-hidden="true">
        <ShoppingBag size={56} strokeWidth={1.2} />
      </div>

      <h3 className="cart-empty-title">
        {t('cart.emptyTitle', { defaultValue: 'Your cart is empty' })}
      </h3>

      <div className="cart-empty-actions">
        <Link
          to="/jerseys"
          className="cart-empty-btn"
          onClick={onActionClick}
        >
          {t('cart.shopJerseys', { defaultValue: 'Shop Jerseys' })}
        </Link>
        <Link
          to="/shoes"
          className="cart-empty-btn"
          onClick={onActionClick}
        >
          {t('cart.shopShoes', { defaultValue: 'Shop Shoes' })}
        </Link>
      </div>
    </div>
  )
}

export const CartDrawer: React.FC = () => {
  const { t } = useLocale()
  const { items } = useCart()
  const { isCartDrawerOpen, closeCartDrawer, cartTriggerElement } =
    useCartDrawer()
  const navigate = useNavigate()

  const [isActive, setIsActive] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const drawerRef = useRef<HTMLDivElement | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  const shouldRender = isCartDrawerOpen || isClosing

  // Capture trigger element whenever drawer opens
  useEffect(() => {
    if (isCartDrawerOpen) {
      triggerRef.current =
        cartTriggerElement ||
        (typeof document !== 'undefined'
          ? (document.activeElement as HTMLElement)
          : null) ||
        (typeof document !== 'undefined'
          ? document.getElementById('nav-cart-btn')
          : null)
    }
  }, [isCartDrawerOpen, cartTriggerElement])

  // Handle slide-out transition and close
  const handleClose = useCallback(() => {
    setIsActive(false)
    setIsClosing(true)

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const duration = prefersReduced ? 0 : 350

    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(() => {
      setIsClosing(false)
      closeCartDrawer()

      // Return focus to trigger button
      const target = triggerRef.current || document.getElementById('nav-cart-btn')
      if (target) {
        try {
          target.focus()
        } catch {
          // ignore
        }
      }
    }, duration)
  }, [closeCartDrawer])

  // Handle slide-in transition
  useEffect(() => {
    if (isCartDrawerOpen) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsActive(true)
        })
      })
      return () => cancelAnimationFrame(id)
    }
  }, [isCartDrawerOpen])

  // Body scroll lock
  useEffect(() => {
    if (!isActive) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isActive])

  // Focus trap & Escape key
  useEffect(() => {
    if (!isActive) return

    // Move initial focus to close button
    const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
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
        const currentFocusable =
          drawerRef.current?.querySelectorAll<HTMLElement>(
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

  const handleCheckout = () => {
    handleClose()
    navigate('/checkout')
  }

  if (!shouldRender || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      className={`cart-drawer-portal ${isActive ? 'is-active' : ''}`}
      aria-hidden={!isActive}
    >
      {/* Dark overlay backdrop */}
      <div
        className={`cart-drawer-overlay ${isActive ? 'is-visible' : ''}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer Dialog */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className={`cart-drawer ${isActive ? 'is-open' : ''}`}
      >
        {/* Header: "Your Cart" bold 22px left, X right, 1px bottom border */}
        <div className="cart-drawer-header">
          <h2 id="cart-drawer-title" className="cart-drawer-title">
            {t('cart.drawerTitle', { defaultValue: 'Your Cart' })}
          </h2>
          <button
            type="button"
            className="cart-drawer-close-btn"
            onClick={handleClose}
            aria-label={t('quickAdd.close', { defaultValue: 'Close' })}
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Middle, scrollable area */}
        <div className="cart-drawer-body">
          {items.length === 0 ? (
            <div className="cart-drawer-empty-wrap">
              <CartEmptyState onActionClick={handleClose} />
            </div>
          ) : (
            <div
              className="cart-drawer-items-list"
              role="list"
              aria-label={t('cart.drawerTitle', { defaultValue: 'Your Cart' })}
            >
              {items.map((item) => (
                <CartItem
                  key={`${item.productSlug}-${item.size ?? 'default'}`}
                  item={item}
                  variant="compact"
                  onNavigate={handleClose}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sticky footer: white, 1px top border */}
        <div className="cart-drawer-footer">
          <CartTotalsBlock
            variant="drawer"
            checkoutButtonText={t('cart.checkout', { defaultValue: 'CHECKOUT' })}
            onCheckoutClick={handleCheckout}
          />
        </div>
      </aside>
    </div>,
    document.body
  )
}
