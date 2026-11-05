import React from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'
import './ProductHeader.css'

export interface ProductHeaderProps {
  title?: string
  totalCount: number
  activeFiltersCount: number
  onOpenFilters: () => void
  filtersButtonRef?: React.RefObject<HTMLButtonElement | null>
  hasChips?: boolean
}

export const ProductHeader: React.FC<ProductHeaderProps> = ({
  title,
  totalCount,
  activeFiltersCount,
  onOpenFilters,
  filtersButtonRef,
  hasChips = false,
}) => {
  const { t } = useLocale()
  const displayTitle = title ?? t('common.bestSellers')
  const countDisplay = t('filters.productCount', { count: totalCount })

  return (
    <div className={`product-header-row ${hasChips ? 'has-chips' : ''}`}>
      {/* Left (Inline-start): Heading & Count */}
      <div className="product-header-left">
        <h1 className="product-header-title">{displayTitle}</h1>
        <span className="product-header-count">
          {countDisplay}
        </span>
      </div>

      {/* Right (Inline-end): Filters Button */}
      <div className="product-header-right">
        <button
          ref={filtersButtonRef}
          type="button"
          className="filter-trigger-btn"
          onClick={onOpenFilters}
          aria-label={t('filters.openFiltersAria', { count: activeFiltersCount })}
          aria-haspopup="dialog"
        >
          <SlidersHorizontal size={14} strokeWidth={2} className="filter-sliders-icon" />
          <span className="filter-trigger-text">{t('filters.heading')}</span>
          {activeFiltersCount > 0 && (
            <span className="filter-badge" aria-label={t('filters.activeFiltersBadgeAria', { count: activeFiltersCount })}>
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
