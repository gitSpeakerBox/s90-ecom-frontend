import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'
import { useCart } from '../../context/CartContext'
import { formatPrice } from '../../utils/formatters'
import {
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
} from '../../constants/cart'
import './CartTotalsBlock.css'

export interface CartTotalsBlockProps {
  variant?: 'page' | 'drawer'
  checkoutButtonText?: string
  onCheckoutClick?: () => void
}

export const CartTotalsBlock: React.FC<CartTotalsBlockProps> = ({
  variant = 'page',
  checkoutButtonText,
  onCheckoutClick,
}) => {
  const { t, language, currency } = useLocale()
  const { items } = useCart()
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false)

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  )

  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD
  const remainingForFree = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const shippingProgressPct = Math.min(
    100,
    Math.max(0, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  )

  const shippingCost =
    items.length === 0 || isFreeShipping ? 0 : STANDARD_SHIPPING_FEE
  const finalTotal = subtotal + shippingCost

  const isCartEmpty = items.length === 0

  return (
    <div
      className={`cart-totals-block ${
        variant === 'drawer'
          ? 'cart-totals-block--drawer'
          : 'cart-totals-block--page'
      }`}
    >
      {/* ── Free Shipping Progress ────────────────────────────────────── */}
      <div className="cart-shipping-bar-container">
        <div className="cart-shipping-bar-text">
          {isFreeShipping ? (
            <span>
              {t('cart.freeShippingUnlocked', {
                defaultValue: "You've unlocked complimentary shipping",
              })}
            </span>
          ) : (
            <span>
              {t('cart.freeShippingProgress', {
                amount: formatPrice(remainingForFree, language, currency),
                defaultValue: `Add ${formatPrice(
                  remainingForFree,
                  language,
                  currency
                )} more for complimentary shipping`,
              })}
            </span>
          )}
        </div>
        <div
          className="cart-shipping-progress-track"
          role="progressbar"
          aria-valuenow={shippingProgressPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="cart-shipping-progress-fill"
            style={{ width: `${shippingProgressPct}%` }}
          />
        </div>
      </div>

      {/* ── Expandable Breakdown ─────────────────────────────────────── */}
      <div
        id="cart-breakdown-details"
        className={`cart-breakdown-panel ${
          isBreakdownOpen ? 'cart-breakdown-panel--open' : ''
        }`}
        aria-hidden={!isBreakdownOpen}
      >
        <div className="cart-breakdown-content">
          <div className="cart-breakdown-row">
            <span>{t('cart.subtotal', { defaultValue: 'Subtotal' })}</span>
            <span>{formatPrice(subtotal, language, currency)}</span>
          </div>
          <div className="cart-breakdown-row">
            <span>{t('cart.shipping', { defaultValue: 'Shipping' })}</span>
            <span
              className={
                isFreeShipping ? 'cart-breakdown-free' : undefined
              }
            >
              {isFreeShipping
                ? t('cart.free', { defaultValue: 'Free' })
                : formatPrice(STANDARD_SHIPPING_FEE, language, currency)}
            </span>
          </div>
          <div className="cart-breakdown-row cart-breakdown-row--bold">
            <span>{t('cart.total', { defaultValue: 'Total' })}</span>
            <span>{formatPrice(finalTotal, language, currency)}</span>
          </div>
        </div>
      </div>

      {/* ── Summary & Checkout ────────────────────────────────────────── */}
      {variant === 'drawer' ? (
        <div className="cart-drawer-action-row">
          <div className="cart-total-price-col">
            <div className="cart-total-price-wrap">
              <span className="cart-total-amount">
                {formatPrice(finalTotal, language, currency)}
              </span>
              <button
                type="button"
                className={`cart-breakdown-toggle-btn ${
                  isBreakdownOpen ? 'cart-breakdown-toggle-btn--rotated' : ''
                }`}
                onClick={() => setIsBreakdownOpen((prev) => !prev)}
                aria-expanded={isBreakdownOpen}
                aria-controls="cart-breakdown-details"
                aria-label={t('cart.toggleBreakdown', {
                  defaultValue: 'Toggle price breakdown',
                })}
              >
                <ChevronDown size={18} strokeWidth={2} />
              </button>
            </div>
            <span className="cart-taxes-note">
              {t('cart.inclusiveOfTaxes', {
                defaultValue: 'Inclusive of all taxes',
              })}
            </span>
          </div>

          <button
            type="button"
            disabled={isCartEmpty}
            className={`cart-checkout-btn cart-drawer-checkout-btn ${
              isCartEmpty ? 'cart-checkout-btn--disabled' : ''
            }`}
            onClick={onCheckoutClick}
            aria-disabled={isCartEmpty}
          >
            {checkoutButtonText ||
              t('cart.checkout', { defaultValue: 'CHECKOUT' })}
          </button>
        </div>
      ) : (
        <>
          <div className="cart-total-main-row">
            <div className="cart-total-price-col">
              <div className="cart-total-price-wrap">
                <span className="cart-total-amount">
                  {formatPrice(finalTotal, language, currency)}
                </span>
                <button
                  type="button"
                  className={`cart-breakdown-toggle-btn ${
                    isBreakdownOpen ? 'cart-breakdown-toggle-btn--rotated' : ''
                  }`}
                  onClick={() => setIsBreakdownOpen((prev) => !prev)}
                  aria-expanded={isBreakdownOpen}
                  aria-controls="cart-breakdown-details"
                  aria-label={t('cart.toggleBreakdown', {
                    defaultValue: 'Toggle price breakdown',
                  })}
                >
                  <ChevronDown size={18} strokeWidth={2} />
                </button>
              </div>
              <span className="cart-taxes-note">
                {t('cart.inclusiveOfTaxes', {
                  defaultValue: 'Inclusive of all taxes',
                })}
              </span>
            </div>
          </div>

          <div className="cart-actions-container">
            <Link
              to="/"
              className={`cart-checkout-btn ${
                isCartEmpty ? 'cart-checkout-btn--disabled' : ''
              }`}
              onClick={(e) => {
                if (isCartEmpty) {
                  e.preventDefault()
                  return
                }
                onCheckoutClick?.()
              }}
              aria-disabled={isCartEmpty}
              tabIndex={isCartEmpty ? -1 : undefined}
            >
              {checkoutButtonText ||
                t('checkout.placeOrder', { defaultValue: 'PLACE ORDER' })}
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
