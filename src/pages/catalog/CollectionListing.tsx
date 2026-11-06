import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'
import {
  ProductHeader,
  FilterDrawer,
  ProductGrid,
  Pagination,
} from '../../components/products'
import type { AppliedFilterChip } from '../../components/products'
import {
  getPaginatedShoes,
  getPaginatedJerseys,
  getCatalogProducts,
  getLocalizedCategory,
} from '../../services/productService'
import type { ProductFilterOptions } from '../../services/productService'
import { getCollectionBySlug } from '../../data/collections'
import './CollectionListing.css'

export const CollectionListing: React.FC = () => {
  const { t, language, currency } = useLocale()
  const { slug = '' } = useParams<{ slug: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const collectionInfo = useMemo(() => {
    return getCollectionBySlug(slug)
  }, [slug])

  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10)
  const currentPage = Number.isFinite(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1
  const sort = searchParams.get('sort') || 'featured'

  const [filterState, setFilterState] = useState<Omit<ProductFilterOptions, 'category'>>({
    type: 'all',
    team: 'all',
    season: 'all',
    size: 'all',
    color: 'all',
    brand: 'all',
    price: 'all',
  })
  const [prevSlug, setPrevSlug] = useState(slug)

  if (prevSlug !== slug) {
    setPrevSlug(slug)
    setFilterState({
      type: 'all',
      team: 'all',
      season: 'all',
      size: 'all',
      color: 'all',
      brand: 'all',
      price: 'all',
    })
  }

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const filtersButtonRef = useRef<HTMLButtonElement>(null)

  // Scroll to top when slug changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [slug])

  const activeFilters: ProductFilterOptions = useMemo(() => {
    return {
      ...filterState,
      category: collectionInfo.category,
    }
  }, [filterState, collectionInfo.category])

  // Removable chips for sub-filters applied inside this collection
  const chips: AppliedFilterChip[] = useMemo(() => {
    const list: AppliedFilterChip[] = []

    Object.entries(filterState).forEach(([key, val]) => {
      if (!val || val === 'all') return
      const keyLabel = t(`filters.${key}`, {
        defaultValue: key.charAt(0).toUpperCase() + key.slice(1),
      })
      if (Array.isArray(val)) {
        val.forEach((v) => {
          let displayVal = String(v)
          if (key === 'type') {
            displayVal = t(`filters.types.${v}`, { defaultValue: String(v) })
          } else if (key === 'team') {
            displayVal = t(`filters.teams.${v}`, { defaultValue: String(v) })
          } else if (key === 'color') {
            displayVal = t(`filters.colors.${String(v).toLowerCase()}`, { defaultValue: String(v) })
          } else if (key === 'season' && v === 'retro') {
            displayVal = t('filters.retroHeritage')
          }
          list.push({ key, label: `${keyLabel}: ${displayVal}`, value: String(v) })
        })
      } else if (key === 'price') {
        const pr = String(val)
        let displayVal = pr
        if (pr === 'under-150') {
          displayVal = t('filters.underPrice', { price: `${currency} 150` })
        } else if (pr === '150-200') {
          displayVal = t('filters.priceRange', { min: `${currency} 150`, max: '200' })
        } else if (pr === 'over-200') {
          displayVal = t('filters.overPrice', { price: `${currency} 200` })
        } else if (pr === 'under-500') {
          displayVal = t('filters.underPrice', { price: `${currency} 500` })
        } else if (pr === '500-1000') {
          displayVal = t('filters.priceRange', { min: `${currency} 500`, max: '1,000' })
        } else if (pr === '1000-2500') {
          displayVal = t('filters.priceRange', { min: `${currency} 1,000`, max: '2,500' })
        } else if (pr === 'over-2500') {
          displayVal = t('filters.overPrice', { price: `${currency} 2,500` })
        } else if (pr.includes('-')) {
          const [min, max] = pr.split('-')
          displayVal = t('filters.priceRange', { min: `${currency} ${min}`, max })
        }
        list.push({ key, label: `${keyLabel}: ${displayVal}`, value: pr })
      } else {
        const strVal = String(val)
        strVal
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((v) => {
            let displayVal = v
            if (key === 'type') {
              displayVal = t(`filters.types.${v}`, { defaultValue: v })
            } else if (key === 'team') {
              displayVal = t(`filters.teams.${v}`, { defaultValue: v })
            } else if (key === 'color') {
              displayVal = t(`filters.colors.${v.toLowerCase()}`, { defaultValue: v })
            } else if (key === 'season' && v === 'retro') {
              displayVal = t('filters.retroHeritage')
            }
            list.push({ key, label: `${keyLabel}: ${displayVal}`, value: v })
          })
      }
    })

    return list
  }, [filterState, currency, t])

  const handleRemoveChip = (key: string, value: string) => {
    setFilterState((prev) => {
      const current = prev[key]
      if (!current || current === 'all') return prev

      if (Array.isArray(current)) {
        const updated = current.filter((v) => String(v) !== value)
        return {
          ...prev,
          [key]: updated.length > 0 ? updated : 'all',
        }
      }

      const parts = String(current)
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s !== value)

      return {
        ...prev,
        [key]: parts.length > 0 ? parts.join(',') : 'all',
      }
    })

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('page')
    setSearchParams(nextParams)
  }

  const handleClearAll = useCallback(() => {
    setFilterState({
      type: 'all',
      team: 'all',
      season: 'all',
      size: 'all',
      color: 'all',
      brand: 'all',
      price: 'all',
    })
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('page')
    setSearchParams(nextParams)
  }, [searchParams, setSearchParams])

  const handleApplyDrawer = (
    newFilters: ProductFilterOptions,
    newSort: string
  ) => {
    const { category: _discardCat, ...rest } = newFilters
    setFilterState(rest)
    const nextParams = new URLSearchParams(searchParams)
    if (newSort && newSort !== 'featured') {
      nextParams.set('sort', newSort)
    } else {
      nextParams.delete('sort')
    }
    nextParams.delete('page')
    setSearchParams(nextParams)

    setTimeout(() => {
      const grid = document.getElementById('catalog-grid')
      if (grid) {
        grid.scrollIntoView({ behavior: 'smooth' })
      }
    }, 50)
  }

  const queryParams = useMemo(() => {
    return {
      page: currentPage,
      limit: 12,
      filters: activeFilters,
      sort,
    }
  }, [currentPage, activeFilters, sort])

  const paginatedData = useMemo(() => {
    if (collectionInfo.type === 'jersey') {
      return getPaginatedJerseys(queryParams)
    }
    return getPaginatedShoes(queryParams)
  }, [collectionInfo.type, queryParams])

  const handlePageChange = useCallback(
    (newPage: number) => {
      const nextParams = new URLSearchParams(searchParams)
      if (newPage <= 1) {
        nextParams.delete('page')
      } else {
        nextParams.set('page', String(newPage))
      }
      setSearchParams(nextParams)
      setTimeout(() => {
        const grid = document.getElementById('catalog-grid')
        if (grid) {
          grid.scrollIntoView({ behavior: 'smooth' })
        }
      }, 50)
    },
    [searchParams, setSearchParams]
  )

  const parentLabel =
    language === 'ar'
      ? collectionInfo.type === 'shoe'
        ? 'الأحذية'
        : 'القمصان'
      : collectionInfo.type === 'shoe'
        ? 'Shoes'
        : 'Jerseys'

  const collectionTitle = useMemo(() => {
    if (collectionInfo.titleKey) {
      const translated = t(collectionInfo.titleKey)
      if (translated && translated !== collectionInfo.titleKey) {
        return translated
      }
    }
    return getLocalizedCategory(collectionInfo.category, language)
  }, [collectionInfo.titleKey, collectionInfo.category, language, t])

  const productsForDrawer = getCatalogProducts(collectionInfo.type)
  const isRTL = language === 'ar'
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight
  const homeLabel = t('common.home', { defaultValue: 'Home' })

  return (
    <div className="collection-listing-page">
      {/* Breadcrumb + Collection Heading */}
      <div className="collection-breadcrumb-wrapper">
        <nav
          className="collection-breadcrumb"
          aria-label={t('common.breadcrumb', { defaultValue: 'Breadcrumb' })}
        >
          <ol className="collection-breadcrumb-list">
            <li className="collection-breadcrumb-item">
              <Link to="/" className="collection-breadcrumb-link">
                {homeLabel}
              </Link>
            </li>
            <li className="collection-breadcrumb-sep" aria-hidden="true">
              <ChevronIcon size={14} />
            </li>
            <li className="collection-breadcrumb-item">
              <Link to={collectionInfo.parentPath} className="collection-breadcrumb-link">
                {parentLabel}
              </Link>
            </li>
            <li className="collection-breadcrumb-sep" aria-hidden="true">
              <ChevronIcon size={14} />
            </li>
            <li className="collection-breadcrumb-item collection-breadcrumb-current" aria-current="page">
              {collectionTitle}
            </li>
          </ol>
        </nav>
        <h1 className="collection-heading">{collectionTitle}</h1>
      </div>

      {/* Product Section */}
      <section
        className="product-area-section"
        id="catalog-grid"
        aria-label={t('common.products')}
      >
        <div className="product-area-container">
          {/* Heading Row with Active Filters */}
          <ProductHeader
            totalCount={paginatedData.total}
            activeFiltersCount={chips.length}
            onOpenFilters={() => setIsDrawerOpen(true)}
            filtersButtonRef={filtersButtonRef}
            chips={chips}
            onRemoveChip={handleRemoveChip}
            onClearAll={handleClearAll}
          />

          {/* Product Grid */}
          <ProductGrid
            products={paginatedData.items}
            emptyMessage={t('filters.emptyMessage')}
            onClearAll={handleClearAll}
          />

          {/* Working Pagination */}
          <Pagination
            currentPage={paginatedData.page}
            totalPages={paginatedData.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </section>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        pageType={collectionInfo.type}
        products={productsForDrawer}
        activeFilters={activeFilters}
        sort={sort}
        onApply={handleApplyDrawer}
        triggerButtonRef={filtersButtonRef}
      />
    </div>
  )
}

