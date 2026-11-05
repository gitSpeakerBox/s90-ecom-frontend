import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'
import './CartEmptyState.css'

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

