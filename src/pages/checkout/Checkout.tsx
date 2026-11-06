import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'
import { useCart } from '../../context/CartContext'
import { CartItem } from '../../components/cart/CartItem'
import { CartTotalsBlock } from '../../components/cart/CartTotalsBlock'
import { CartEmptyState } from '../../components/cart/CartDrawer'
import './Checkout.css'

export const Checkout = () => {
  const { t } = useLocale()
  const { items, cartCount } = useCart()

  return (
    <div className="checkout-page">
      <div className="checkout-page-header">
        <h1 className="checkout-page-title">
          {t('checkout.title', { defaultValue: 'Checkout' })}
        </h1>
        {cartCount > 0 && (
          <span className="checkout-order-summary-badge">
            {t(
              cartCount === 1
                ? 'checkout.orderSummary_one'
                : 'checkout.orderSummary_other',
              {
                count: cartCount,
                defaultValue: `Order summary (${cartCount})`,
              }
            )}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="checkout-page-empty-wrap">
          <CartEmptyState />
        </div>
      ) : (
        <div className="checkout-page-layout">
          {/* Items List */}
          <div
            className="checkout-page-items-list"
            role="list"
            aria-label={t(
              cartCount === 1
                ? 'checkout.orderSummary_one'
                : 'checkout.orderSummary_other',
              {
                count: cartCount,
                defaultValue: `Order summary (${cartCount})`,
              }
            )}
          >
            <div className="checkout-list-header-row">
              <span className="checkout-list-subtitle">
                {t(
                  cartCount === 1
                    ? 'checkout.orderSummary_one'
                    : 'checkout.orderSummary_other',
                  {
                    count: cartCount,
                    defaultValue: `Order summary (${cartCount})`,
                  }
                )}
              </span>
              <Link to="/jerseys" className="checkout-continue-link">
                <ArrowLeft size={14} className="checkout-continue-arrow" />
                <span>
                  {t('checkout.continueShopping', {
                    defaultValue: 'Continue shopping',
                  })}
                </span>
              </Link>
            </div>

            {items.map((item) => (
              <CartItem
                key={`${item.productSlug}-${item.size ?? 'default'}`}
                item={item}
                variant="page"
              />
            ))}

            <div className="checkout-list-footer-row">
              <Link to="/jerseys" className="checkout-continue-link">
                <ArrowLeft size={14} className="checkout-continue-arrow" />
                <span>
                  {t('checkout.continueShopping', {
                    defaultValue: 'Continue shopping',
                  })}
                </span>
              </Link>
            </div>
          </div>

          {/* Order Totals Block on the right (desktop) / below (mobile) */}
          <aside
            className="checkout-page-summary-aside"
            aria-label={t('cart.subtotal', { defaultValue: 'Summary' })}
          >
            <CartTotalsBlock
              variant="page"
              checkoutButtonText={t('checkout.placeOrder', {
                defaultValue: 'PLACE ORDER',
              })}
            />
          </aside>
        </div>
      )}
    </div>
  )
}

