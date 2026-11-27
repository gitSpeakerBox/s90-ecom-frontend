import React from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'
import './ProductHeader.css'

export interface AppliedFilterChip {
  key: string
  label: string
  value: string
}

export interface ProductHeaderProps {
  title?: string
  totalCount: number
  activeFiltersCount: number
  onOpenFilters: () => void
  filtersButtonRef?: React.RefObject<HTMLButtonElement | null>
  chips?: AppliedFilterChip[]
  onRemoveChip?: (key: string, value: string) => void
  onClearAll?: () => void
}

export const ProductHeader: React.FC<ProductHeaderProps> = ({
  title,
  totalCount,
  activeFiltersCount,
  onOpenFilters,
  filtersButtonRef,
  chips = [],
  onRemoveChip,
  onClearAll,
}) => {
  const { t } = useLocale()
  const displayTitle = title ?? t('common.bestSellers')
  const countDisplay = t('filters.productCount', { count: totalCount })
  const hasChips = chips.length > 0

  return (
    <div className="product-header-container">
      {/* Top Heading Row */}
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

      {/* Filter Chips Section */}
      {hasChips && (
        <div className="filter-chips-section">
          <div className="filter-chips-inner">
            <div className="filter-chips-list">
              {chips.map((chip) => (
                <span key={`${chip.key}-${chip.value}`} className="filter-chip">
                  <span className="filter-chip-text">{chip.label}</span>
                  {onRemoveChip && (
                    <button
                      type="button"
                      className="filter-chip-remove"
                      onClick={() => onRemoveChip(chip.key, chip.value)}
                      aria-label={t('filters.removeFilterAria', { label: chip.label })}
                    >
                      <X size={12} strokeWidth={2} />
                    </button>
                  )}
                </span>
              ))}

              {onClearAll && (
                <button
                  type="button"
                  className="filter-chips-clear-all"
                  onClick={onClearAll}
                >
                  {t('filters.clearAll')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
