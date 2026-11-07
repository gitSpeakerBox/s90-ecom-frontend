/* oxlint-disable react/only-export-components */
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown,
  Truck,
  CheckCircle2,
  Tag,
  X,
  AlertCircle,
  Check,
  ShieldCheck,
  Lock,
} from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'
import { useCart } from '../../context/CartContext'
import { formatPrice } from '../../utils/formatters'
import {
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  DEMO_COUPONS,
  type CouponDefinition,
} from '../../constants/cart'
import visaLogo from '../../assets/payment/visa.svg'
import mastercardLogo from '../../assets/payment/mastercard.svg'
import applePayLogo from '../../assets/payment/apple-pay.svg'
import tabbyLogo from '../../assets/payment/tabby.svg'
import tamaraLogo from '../../assets/payment/tamara.svg'
import { CartItem } from './CartItem'
import './CartTotalsBlock.css'

export { DEMO_COUPONS, type CouponDefinition } from '../../constants/cart'

export interface CartTotalsBlockProps {
  variant?: 'page' | 'drawer'
  checkoutButtonText?: string
  onCheckoutClick?: () => void
  showItems?: boolean
  showActions?: boolean
  showLogos?: boolean
  appliedCoupon?: CouponDefinition | null
  onCouponChange?: (coupon: CouponDefinition | null) => void
  onTotalsChange?: (totals: {
    subtotal: number
    discountAmount: number
    shippingCost: number
    finalTotal: number
    isFreeShipping: boolean
  }) => void
}

export const CartTotalsBlock: React.FC<CartTotalsBlockProps> = ({
  variant = 'page',
  checkoutButtonText,
  onCheckoutClick,
  showItems = false,
  showActions = true,
  showLogos = true,
  appliedCoupon: controlledCoupon,
  onCouponChange,
  onTotalsChange,
}) => {
  const { t, language, currency } = useLocale()
  const { items } = useCart()

  // Drawer breakdown collapsed state
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false)

  // Coupon state for page variant
  const [couponInput, setCouponInput] = useState('')
  const [internalAppliedCoupon, setInternalAppliedCoupon] = useState<CouponDefinition | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null)

  const appliedCoupon = controlledCoupon !== undefined ? controlledCoupon : internalAppliedCoupon

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

  // Discount computation
  const discountAmount = appliedCoupon
    ? Math.round(((subtotal * appliedCoupon.discountPercent) / 100) * 100) / 100
    : 0

  const finalTotalWithDiscount = Math.max(
    0,
    subtotal - discountAmount + shippingCost
  )
  const finalTotal = subtotal + shippingCost

  const isCartEmpty = items.length === 0

  // Notify parent of total changes
  useEffect(() => {
    onTotalsChange?.({
      subtotal,
      discountAmount,
      shippingCost,
      finalTotal: finalTotalWithDiscount,
      isFreeShipping,
    })
  }, [subtotal, discountAmount, shippingCost, finalTotalWithDiscount, isFreeShipping, onTotalsChange])

  // Coupon submission handler
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = couponInput.trim().toUpperCase()

    if (!trimmed) {
      setCouponError(
        t('checkout.couponEmpty', {
          defaultValue: 'Please enter a coupon code',
        })
      )
      setCouponSuccess(null)
      return
    }

    const matched = DEMO_COUPONS[trimmed]
    if (matched) {
      if (onCouponChange) {
        onCouponChange(matched)
      } else {
        setInternalAppliedCoupon(matched)
      }
      setCouponError(null)
      setCouponSuccess(
        t('checkout.couponApplied', {
          code: matched.code,
          defaultValue: `Coupon "${matched.code}" applied!`,
        })
      )
      setCouponInput('')
    } else {
      setCouponError(
        t('checkout.couponInvalid', {
          defaultValue: 'Invalid or expired coupon code',
        })
      )
      setCouponSuccess(null)
    }
  }

  // Coupon removal handler
  const handleRemoveCoupon = () => {
    if (onCouponChange) {
      onCouponChange(null)
    } else {
      setInternalAppliedCoupon(null)
    }
    setCouponError(null)
    setCouponSuccess(null)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DRAWER VARIANT (slide-out cart sheet)
  // ─────────────────────────────────────────────────────────────────────────────
  if (variant === 'drawer') {
    return (
      <div className="cart-totals-block cart-totals-block--drawer">
        {/* Free Shipping Progress */}
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

        {/* Expandable Breakdown */}
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

        {/* Drawer Action Row */}
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
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGE VARIANT (Full 2026 Redesigned Checkout Order Summary)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="cart-totals-block cart-totals-block--page checkout-summary-card">
      <h2 className="checkout-summary-title">
        {t('checkout.orderSummaryHeading', { defaultValue: 'Order Summary' })}
      </h2>

      {/* ── Area A: Scrollable Product List ─────────────────────────────── */}
      {showItems && items.length > 0 && (
        <div
          className="checkout-summary-products-scroll-area checkout-summary-items-stack"
          role="list"
          aria-label={t('checkout.orderSummaryHeading', { defaultValue: 'Order Summary' })}
        >
          {items.map((item) => (
            <CartItem
              key={`${item.productSlug}-${item.size ?? 'default'}`}
              item={item}
              variant="compact"
            />
          ))}
        </div>
      )}

      {/* ── Area B: Fixed Summary Section ──────────────────────────────── */}
      <div className="checkout-summary-fixed-section">
        {/* Shipping Progress */}
        <div className="checkout-shipping-progress-card">
          <div className="checkout-shipping-progress-header">
            <div className="checkout-shipping-progress-icon-wrap">
              {isFreeShipping ? (
                <CheckCircle2
                  size={16}
                  className="checkout-shipping-icon checkout-shipping-icon--success"
                />
              ) : (
                <Truck size={16} className="checkout-shipping-icon" />
              )}
              <span className="checkout-shipping-title">
                {t('checkout.freeShippingBadge', {
                  defaultValue: 'Complimentary Express Shipping',
                })}
              </span>
            </div>
            {isFreeShipping && (
              <span className="checkout-shipping-pill-unlocked">
                {t('cart.free', { defaultValue: 'FREE' })}
              </span>
            )}
          </div>

          <p className="checkout-shipping-text">
            {isFreeShipping
              ? t('cart.freeShippingUnlocked', {
                  defaultValue: "You've unlocked complimentary shipping",
                })
              : t('cart.freeShippingProgress', {
                  amount: formatPrice(remainingForFree, language, currency),
                  defaultValue: `Add ${formatPrice(
                    remainingForFree,
                    language,
                    currency
                  )} more for complimentary shipping`,
                })}
          </p>

          <div
            className="checkout-shipping-track"
            role="progressbar"
            aria-valuenow={shippingProgressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`checkout-shipping-fill ${
                isFreeShipping ? 'checkout-shipping-fill--unlocked' : ''
              }`}
              style={{ width: `${shippingProgressPct}%` }}
            />
          </div>
        </div>

        {/* Promo code input and Apply button */}
        <div className="checkout-coupon-section">
          <label htmlFor="checkout-coupon-input" className="checkout-coupon-label">
            <Tag size={13} className="checkout-coupon-label-icon" />
            <span>{t('checkout.promoCode', { defaultValue: 'Promo Code' })}</span>
          </label>

          {appliedCoupon ? (
            <div className="checkout-coupon-applied-card">
              <div className="checkout-coupon-applied-info">
                <span className="checkout-coupon-badge">{appliedCoupon.code}</span>
                <span className="checkout-coupon-discount-text">
                  {`-${appliedCoupon.discountPercent}%`}
                </span>
              </div>
              <button
                type="button"
                className="checkout-coupon-remove-btn"
                onClick={handleRemoveCoupon}
                aria-label={t('checkout.remove', { defaultValue: 'Remove coupon' })}
              >
                <X size={14} />
                <span>{t('checkout.remove', { defaultValue: 'Remove' })}</span>
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleApplyCoupon}
              className="checkout-coupon-form"
              noValidate
            >
              <div className="checkout-coupon-input-group">
                <input
                  id="checkout-coupon-input"
                  type="text"
                  className={`checkout-coupon-input ${
                    couponError ? 'checkout-coupon-input--error' : ''
                  }`}
                  placeholder={t('checkout.couponPlaceholder', {
                    defaultValue: 'Enter promo code',
                  })}
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value)
                    if (couponError) setCouponError(null)
                  }}
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="submit"
                  className="checkout-coupon-apply-btn"
                  disabled={!couponInput.trim()}
                >
                  {t('checkout.apply', { defaultValue: 'APPLY' })}
                </button>
              </div>
            </form>
          )}

          {couponError && (
            <div
              className="checkout-coupon-message checkout-coupon-message--error"
              role="alert"
            >
              <AlertCircle size={13} />
              <span>{couponError}</span>
            </div>
          )}

          {couponSuccess && !appliedCoupon && (
            <div className="checkout-coupon-message checkout-coupon-message--success">
              <Check size={13} />
              <span>{couponSuccess}</span>
            </div>
          )}
        </div>

        {/* Amount Details: Subtotal, Shipping, Discount, Final total */}
        <div className="checkout-summary-breakdown">
          {/* Subtotal */}
          <div className="checkout-breakdown-row">
            <span className="checkout-breakdown-label">
              {t('cart.subtotal', { defaultValue: 'Subtotal' })}
            </span>
            <span className="checkout-breakdown-value">
              {formatPrice(subtotal, language, currency)}
            </span>
          </div>

          {/* Discount (if applicable) */}
          {appliedCoupon && discountAmount > 0 && (
            <div className="checkout-breakdown-row checkout-breakdown-row--discount">
              <span className="checkout-breakdown-label">
                {t('checkout.couponDiscount', {
                  code: appliedCoupon.code,
                  defaultValue: `Discount (${appliedCoupon.code})`,
                })}
              </span>
              <span className="checkout-breakdown-value checkout-breakdown-value--discount">
                -{formatPrice(discountAmount, language, currency)}
              </span>
            </div>
          )}

          {/* Shipping */}
          <div className="checkout-breakdown-row">
            <span className="checkout-breakdown-label">
              {t('cart.shipping', { defaultValue: 'Shipping charges' })}
            </span>
            <span
              className={`checkout-breakdown-value ${
                isFreeShipping ? 'checkout-breakdown-value--free' : ''
              }`}
            >
              {isFreeShipping
                ? t('cart.free', { defaultValue: 'Free' })
                : formatPrice(STANDARD_SHIPPING_FEE, language, currency)}
            </span>
          </div>

          {/* Prominent Final Total */}
          <div className="checkout-breakdown-divider" />

          <div className="checkout-breakdown-row checkout-breakdown-row--total">
            <span className="checkout-total-label">
              {t('cart.total', { defaultValue: 'Final total' })}
            </span>
            <span className="checkout-total-amount">
              {formatPrice(finalTotalWithDiscount, language, currency)}
            </span>
          </div>
        </div>

        {/* ── Place Order Action ────────────────────────────────────────── */}
        {showActions && (
          <div className="checkout-actions-wrap">
            <Link
              to="/"
              className={`checkout-place-order-btn ${
                isCartEmpty ? 'checkout-place-order-btn--disabled' : ''
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
        )}

        {/* ── Security Information & Accepted Payment Methods ───────────── */}
        {showLogos && (
          <div className="checkout-trust-badges">
            <div className="checkout-security-row">
              <div className="checkout-trust-badge-item">
                <ShieldCheck size={14} className="checkout-trust-icon" />
                <span>
                  {t('checkout.secureCheckout', {
                    defaultValue: '100% Secure Checkout',
                  })}
                </span>
              </div>
              <div className="checkout-trust-badge-item">
                <Lock size={13} className="checkout-trust-icon" />
                <span>
                  {t('checkout.sslEncrypted', {
                    defaultValue: 'SSL 256-Bit Encrypted',
                  })}
                </span>
              </div>
            </div>

            <div
              className="checkout-payment-methods-strip"
              aria-label={t('checkout.acceptedPaymentMethods', {
                defaultValue: 'Accepted Payment Methods',
              })}
            >
              <span
                className="checkout-payment-badge checkout-payment-badge--visa"
                title="Visa"
              >
                <img
                  src={visaLogo}
                  alt="Visa"
                  className="checkout-payment-logo"
                  width="50"
                  height="30"
                  loading="lazy"
                />
              </span>
              <span
                className="checkout-payment-badge checkout-payment-badge--mastercard"
                title="Mastercard"
              >
                <img
                  src={mastercardLogo}
                  alt="Mastercard"
                  className="checkout-payment-logo"
                  width="44"
                  height="30"
                  loading="lazy"
                />
              </span>
              <span
                className="checkout-payment-badge checkout-payment-badge--applepay"
                title="Apple Pay"
              >
                <img
                  src={applePayLogo}
                  alt="Apple Pay"
                  className="checkout-payment-logo"
                  width="52"
                  height="30"
                  loading="lazy"
                />
              </span>
              <span
                className="checkout-payment-badge checkout-payment-badge--tabby"
                title="Tabby"
              >
                <img
                  src={tabbyLogo}
                  alt="Tabby"
                  className="checkout-payment-logo"
                  width="54"
                  height="30"
                  loading="lazy"
                />
              </span>
              <span
                className="checkout-payment-badge checkout-payment-badge--tamara"
                title="Tamara"
              >
                <img
                  src={tamaraLogo}
                  alt="Tamara"
                  className="checkout-payment-logo"
                  width="58"
                  height="30"
                  loading="lazy"
                />
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
