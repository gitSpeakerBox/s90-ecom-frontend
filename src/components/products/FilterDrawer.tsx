import React, { useState, useEffect, useRef } from 'react'
import { SlidersHorizontal, X, ChevronDown, Check } from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'
import type { Product } from '../../types/product'
import type { ProductFilterOptions } from '../../services/productService'
import {
  JERSEY_FILTER_CONFIG,
  SHOE_FILTER_CONFIG,
  computeOptionCounts,
} from './filterConfig'
import type { FilterSectionConfig } from './filterConfig'
import './FilterDrawer.css'

export interface FilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  pageType: 'jersey' | 'shoe'
  products: Product[]
  activeFilters: ProductFilterOptions
  sort: string
  onApply: (filters: ProductFilterOptions, sort: string) => void
  triggerButtonRef?: React.RefObject<HTMLButtonElement | null>
}

function parsePriceRange(
  priceVal: string | undefined,
  defaultMin: number,
  defaultMax: number
): { min: number; max: number } {
  if (!priceVal || priceVal === 'all') {
    return { min: defaultMin, max: defaultMax }
  }
  if (priceVal === 'under-150') return { min: defaultMin, max: 150 }
  if (priceVal === '150-200') return { min: 150, max: 200 }
  if (priceVal === 'over-200') return { min: 200, max: defaultMax }
  if (priceVal === 'under-500') return { min: defaultMin, max: 500 }
  if (priceVal === '500-1000') return { min: 500, max: 1000 }
  if (priceVal === '1000-2500') return { min: 1000, max: 2500 }
  if (priceVal === 'over-2500') return { min: 2500, max: defaultMax }
  const parts = priceVal.split('-')
  if (parts.length === 2) {
    const min = Number(parts[0]) || defaultMin
    const max = Number(parts[1]) || defaultMax
    return { min, max }
  }
  return { min: defaultMin, max: defaultMax }
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  pageType,
  products,
  activeFilters,
  sort,
  onApply,
  triggerButtonRef,
}) => {
  const { t, currency } = useLocale()
  const sections: FilterSectionConfig[] =
    pageType === 'jersey' ? JERSEY_FILTER_CONFIG : SHOE_FILTER_CONFIG

  // Price range bounds based on page type
  const defaultMinPrice = pageType === 'jersey' ? 200 : 300
  const defaultMaxPrice = pageType === 'jersey' ? 400 : 800

  // Temporary filter and sort state
  const [tempFilters, setTempFilters] = useState<ProductFilterOptions>(() => ({
    ...activeFilters,
  }))
  const [tempSort, setTempSort] = useState<string>(sort)
  const initialPrice = parsePriceRange(
    activeFilters.price as string | undefined,
    defaultMinPrice,
    defaultMaxPrice
  )
  const [minPriceInput, setMinPriceInput] = useState<number>(initialPrice.min)
  const [maxPriceInput, setMaxPriceInput] = useState<number>(initialPrice.max)

  // Track previous open state to sync on drawer open without setState in effect
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setTempFilters({ ...activeFilters })
      setTempSort(sort)
      const parsed = parsePriceRange(
        activeFilters.price as string | undefined,
        defaultMinPrice,
        defaultMaxPrice
      )
      setMinPriceInput(parsed.min)
      setMaxPriceInput(parsed.max)
    }
  }

  // Accordion open/close state: track open section ids
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    sections.forEach((s) => {
      initial[s.id] = true
    })
    return initial
  })

  const drawerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  // Focus trapping and keyboard navigation (Escape, Tab)
  useEffect(() => {
    if (!isOpen) return

    const triggerBtn = triggerButtonRef?.current

    // Focus the close button initially
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus()
    }, 50)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return

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
      clearTimeout(timer)
      window.removeEventListener('keydown', handleKeyDown)
      // Return focus to the trigger button when closing
      triggerBtn?.focus()
    }
  }, [isOpen, onClose, triggerButtonRef])

  // Toggle accordion section
  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Helper to get array of selected values for a key
  const getSelectedValues = (key: string): string[] => {
    const val = tempFilters[key]
    if (!val || val === 'all') return []
    if (Array.isArray(val)) return val.map(String)
    return String(val)
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && s !== 'all')
  }

  // Toggle selection for multi-value filters (team, season, size, color, brand, type)
  const toggleFilterValue = (key: string, value: string) => {
    const current = getSelectedValues(key)
    const exists = current.includes(value)
    let next: string[]
    if (exists) {
      next = current.filter((v) => v !== value)
    } else {
      next = [...current, value]
    }

    setTempFilters((prev) => ({
      ...prev,
      [key]: next.length > 0 ? next : 'all',
    }))
  }

  // Update min price
  const handleMinPriceChange = (newMin: number) => {
    const min = Math.max(defaultMinPrice, Math.min(newMin, maxPriceInput))
    setMinPriceInput(min)
    if (min === defaultMinPrice && maxPriceInput === defaultMaxPrice) {
      setTempFilters((prev) => ({ ...prev, price: 'all' }))
    } else {
      setTempFilters((prev) => ({ ...prev, price: `${min}-${maxPriceInput}` }))
    }
  }

  // Update max price
  const handleMaxPriceChange = (newMax: number) => {
    const max = Math.max(minPriceInput, Math.min(newMax, defaultMaxPrice))
    setMaxPriceInput(max)
    if (minPriceInput === defaultMinPrice && max === defaultMaxPrice) {
      setTempFilters((prev) => ({ ...prev, price: 'all' }))
    } else {
      setTempFilters((prev) => ({ ...prev, price: `${minPriceInput}-${max}` }))
    }
  }

  // Single range slider change (controls max price)
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    setMaxPriceInput(val)
    if (minPriceInput === defaultMinPrice && val === defaultMaxPrice) {
      setTempFilters((prev) => ({ ...prev, price: 'all' }))
    } else {
      setTempFilters((prev) => ({ ...prev, price: `${minPriceInput}-${val}` }))
    }
  }

  // Clear All button inside drawer
  const handleClearAll = () => {
    const cleared: ProductFilterOptions = {
      team: 'all',
      season: 'all',
      size: 'all',
      color: 'all',
      price: 'all',
      type: 'all',
      brand: 'all',
    }
    // Keep category if currently present
    if (tempFilters.category) {
      cleared.category = tempFilters.category
    }
    setTempFilters(cleared)
    setTempSort('featured')
    setMinPriceInput(defaultMinPrice)
    setMaxPriceInput(defaultMaxPrice)
  }

  // Apply Filter button inside drawer
  const handleApply = () => {
    onApply(tempFilters, tempSort)
    onClose()
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`filter-overlay ${isOpen ? 'is-visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        ref={drawerRef}
        className={`filter-drawer ${isOpen ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-drawer-title"
      >
        {/* Header */}
        <div className="filter-drawer-header">
          <div className="filter-drawer-title-group">
            <SlidersHorizontal size={17} strokeWidth={2} />
            <h2 id="filter-drawer-title" className="filter-drawer-title">
              {t('filters.title')}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="filter-drawer-close-btn"
            onClick={onClose}
            aria-label={t('filters.closeDrawer')}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable Body: Accordion Sections */}
        <div className="filter-drawer-body">
          {sections.map((section) => {
            const isExpanded = !!openSections[section.id]
            const sectionControlsId = `filter-section-content-${section.id}`
            const selectedVals = getSelectedValues(section.id)

            return (
              <div key={section.id} className="filter-accordion-section">
                <button
                  type="button"
                  className="filter-accordion-header"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={isExpanded}
                  aria-controls={sectionControlsId}
                >
                  <span className="filter-accordion-label">
                    {t(`filters.${section.id}`, { defaultValue: section.label })}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`filter-accordion-chevron ${isExpanded ? 'is-open' : ''}`}
                  />
                </button>

                {isExpanded && (
                  <div id={sectionControlsId} className="filter-accordion-content">
                    {/* Checkbox List (Team, Season, Type, Brand) */}
                    {section.type === 'checkbox' && section.options && (
                      <div className="filter-checkbox-list">
                        {section.options.map((opt) => {
                          const isChecked = selectedVals.includes(opt.value)
                          const count = computeOptionCounts(
                            products,
                            pageType,
                            section.id,
                            opt.value
                          )

                          let optionLabel = opt.label
                          if (section.id === 'season' && opt.value === 'retro') {
                            optionLabel = t('filters.retroHeritage')
                          } else if (section.id === 'type') {
                            optionLabel = t(`filters.types.${opt.value}`, { defaultValue: opt.label })
                          } else if (section.id === 'team') {
                            optionLabel = t(`filters.teams.${opt.value}`, { defaultValue: opt.label })
                          }

                          return (
                            <label
                              key={opt.value}
                              className={`filter-checkbox-row ${isChecked ? 'is-checked' : ''}`}
                            >
                              <div className="filter-checkbox-input-wrap">
                                <input
                                  type="checkbox"
                                  className="filter-checkbox-input"
                                  checked={isChecked}
                                  onChange={() => toggleFilterValue(section.id, opt.value)}
                                />
                                <span className="filter-checkbox-custom" aria-hidden="true">
                                  {isChecked && <Check size={11} strokeWidth={3} />}
                                </span>
                              </div>
                              <span className="filter-checkbox-label">{optionLabel}</span>
                              <span className="filter-checkbox-count">({count})</span>
                            </label>
                          )
                        })}
                      </div>
                    )}

                    {/* Size Toggle Buttons */}
                    {section.type === 'size-toggle' && section.options && (
                      <div className="filter-size-grid">
                        {section.options.map((opt) => {
                          const isSelected = selectedVals
                              .map((v) => v.toUpperCase())
                              .includes(opt.value.toUpperCase())

                          return (
                            <button
                              key={opt.value}
                              type="button"
                              className={`filter-size-btn ${isSelected ? 'is-selected' : ''}`}
                              onClick={() => toggleFilterValue(section.id, opt.value)}
                              aria-pressed={isSelected}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Color Round Swatches */}
                    {section.type === 'color-swatch' && section.options && (
                      <div className="filter-color-grid">
                        {section.options.map((opt) => {
                          const isSelected = selectedVals
                            .map((v) => v.toLowerCase())
                            .includes(opt.value.toLowerCase())
                          const bgHex = opt.hex || '#ffffff'
                          const isLightColor =
                            opt.value.toLowerCase() === 'white' ||
                            opt.value.toLowerCase() === 'beige' ||
                            opt.value.toLowerCase() === 'yellow'
                          const localizedColor = t(`filters.colors.${opt.value.toLowerCase()}`, {
                            defaultValue: opt.label,
                          })

                          return (
                            <button
                              key={opt.value}
                              type="button"
                              className={`filter-color-swatch ${isSelected ? 'is-selected' : ''}`}
                              style={{ backgroundColor: bgHex }}
                              onClick={() => toggleFilterValue(section.id, opt.value)}
                              title={localizedColor}
                              aria-label={localizedColor}
                              aria-pressed={isSelected}
                            >
                              {isSelected && (
                                <Check
                                  size={14}
                                  strokeWidth={3}
                                  className={`filter-color-check ${isLightColor ? 'is-dark' : 'is-light'}`}
                                />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Price Min/Max number inputs + range slider */}
                    {section.type === 'price-range' && (
                      <div className="filter-price-wrap">
                        <div className="filter-price-inputs">
                          <div className="filter-price-field">
                            <span className="filter-price-label">{t('filters.min')}</span>
                            <div className="filter-price-input-box">
                              <span className="filter-price-curr">{currency}</span>
                              <input
                                type="number"
                                min={defaultMinPrice}
                                max={maxPriceInput}
                                value={minPriceInput}
                                onChange={(e) =>
                                  handleMinPriceChange(Number(e.target.value))
                                }
                                className="filter-price-num-input"
                                aria-label={t('filters.minPriceAria')}
                              />
                            </div>
                          </div>

                          <span className="filter-price-separator">&ndash;</span>

                          <div className="filter-price-field">
                            <span className="filter-price-label">{t('filters.max')}</span>
                            <div className="filter-price-input-box">
                              <span className="filter-price-curr">{currency}</span>
                              <input
                                type="number"
                                min={minPriceInput}
                                max={defaultMaxPrice}
                                value={maxPriceInput}
                                onChange={(e) =>
                                  handleMaxPriceChange(Number(e.target.value))
                                }
                                className="filter-price-num-input"
                                aria-label={t('filters.maxPriceAria')}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Range slider */}
                        <div className="filter-price-slider-wrap">
                          <input
                            type="range"
                            min={defaultMinPrice}
                            max={defaultMaxPrice}
                            step={section.step || 5}
                            value={maxPriceInput}
                            onChange={handleSliderChange}
                            className="filter-price-range-slider"
                            aria-label={t('filters.priceCeilingAria')}
                          />
                          <div className="filter-price-slider-ticks">
                            <span>{currency} {defaultMinPrice}</span>
                            <span>{currency} {defaultMaxPrice}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sort By Single Select List */}
                    {section.type === 'sort-radio' && section.options && (
                      <div className="filter-sort-list" role="radiogroup" aria-label={t('filters.sortOptionsAria')}>
                        {section.options.map((opt) => {
                          const isSelected = tempSort === opt.value
                          const sortLabel =
                            opt.value === 'featured'
                              ? t('filters.featured')
                              : opt.value === 'newest'
                              ? t('filters.newest')
                              : opt.value === 'price-asc'
                              ? t('filters.priceLowHigh')
                              : opt.value === 'price-desc'
                              ? t('filters.priceHighLow')
                              : opt.label

                          return (
                            <button
                              key={opt.value}
                              type="button"
                              className={`filter-sort-item ${isSelected ? 'is-selected' : ''}`}
                              onClick={() => setTempSort(opt.value)}
                              role="radio"
                              aria-checked={isSelected}
                            >
                              <span className="filter-sort-label">{sortLabel}</span>
                              {isSelected && (
                                <Check size={14} strokeWidth={2.5} className="filter-sort-check" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Sticky Footer */}
        <div className="filter-drawer-footer">
          <button
            type="button"
            className="filter-footer-btn filter-btn-clear"
            onClick={handleClearAll}
          >
            {t('filters.clearAll')}
          </button>
          <button
            type="button"
            className="filter-footer-btn filter-btn-apply"
            onClick={handleApply}
          >
            {t('filters.apply')}
          </button>
        </div>
      </aside>
    </>
  )
}
