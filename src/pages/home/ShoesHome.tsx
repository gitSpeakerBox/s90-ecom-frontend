import React, { useState, useMemo, useRef, useCallback } from 'react'
import { useSearchParams, Navigate } from 'react-router-dom'
import { useLocale } from '../../context/LocaleContext'
import { HeroSlider } from '../../components/common/HeroSlider'
import type { HeroSlideItem } from '../../components/common/HeroSlider'
import {
  ProductHeader,
  FilterDrawer,
  ProductGrid,
  Pagination,
} from '../../components/products'
import { AboutSection } from '../../components/common/AboutSection'
import { CollectionSubBanner } from '../../components/common/CollectionSubBanner'
import { shoesCollectionCards } from '../../data/collectionBanners'
import { allShoes, getPaginatedShoes } from '../../services/productService'
import type { ProductFilterOptions } from '../../services/productService'
import { getCollectionSlugForCategory } from '../../data/collections'
import { useProductFilterChips } from '../../hooks/useProductFilterChips'
import './ShoesHome.css'

export const ShoesHome: React.FC = () => {
  const { t, currency } = useLocale()
  const [searchParams, setSearchParams] = useSearchParams()

  const urlCategory = searchParams.get('category') || ''
  const urlSort = searchParams.get('sort') || 'featured'
  const shouldRedirect = Boolean(urlCategory && urlCategory !== 'all')
  const redirectSlug = shouldRedirect
    ? getCollectionSlugForCategory('shoe', urlCategory)
    : ''

  const [filterState, setFilterState] = useState<Omit<ProductFilterOptions, 'category'>>({
    type: 'all',
    size: 'all',
    color: 'all',
    brand: 'all',
    price: 'all',
  })

  const [sort, setSort] = useState<string>(urlSort)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const filtersButtonRef = useRef<HTMLButtonElement>(null)

  const activeFilters: ProductFilterOptions = useMemo(() => {
    return {
      ...filterState,
      category: 'all',
    }
  }, [filterState])

  // Consolidated filter chips hook
  const { chips, handleRemoveChip } = useProductFilterChips({
    filterState,
    setFilterState,
    setCurrentPage,
    currency,
    t,
  })

  const handleClearAll = useCallback(() => {
    setFilterState({
      type: 'all',
      size: 'all',
      color: 'all',
      brand: 'all',
      price: 'all',
    })
    setSort('featured')
    setCurrentPage(1)
    setSearchParams({})
  }, [setSearchParams])

  const handleApplyDrawer = (
    newFilters: ProductFilterOptions,
    newSort: string
  ) => {
    const { category: _discardCat, ...rest } = newFilters
    setFilterState(rest)
    setSort(newSort)
    setCurrentPage(1)

    // Smooth scroll product grid into view
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
    return getPaginatedShoes(queryParams)
  }, [queryParams])

  const handleShopAllClick = useCallback(() => {
    handleClearAll()
    const grid = document.getElementById('catalog-grid')
    if (grid) {
      grid.scrollIntoView({ behavior: 'smooth' })
    }
  }, [handleClearAll])

  const heroSlides: HeroSlideItem[] = useMemo(
    () => [
      {
        image: '/images/hero-shoes-1.jpg',
        eyebrow: t('hero.shoesEyebrow'),
        title: t('hero.shoesTitle'),
        text: t('hero.shoesDesc'),
        buttonLabel: t('hero.shopAllShoes'),
        to: '#catalog-grid',
        imageAlt: t('hero.shoesAlt'),
        onButtonClick: handleShopAllClick,
      },
      {
        image: '/images/hero-shoes-2.png',
        eyebrow: t('hero.shoesSlide2Eyebrow'),
        title: t('hero.shoesSlide2Title'),
        text: t('hero.shoesSlide2Desc'),
        buttonLabel: t('hero.shoesSlide2Cta'),
        to: '#catalog-grid',
      },
      {
        image: '/images/hero-shoes-3.png',
        eyebrow: t('hero.shoesSlide3Eyebrow'),
        title: t('hero.shoesSlide3Title'),
        text: t('hero.shoesSlide3Desc'),
        buttonLabel: t('hero.shoesSlide3Cta'),
        to: '#catalog-grid',
      },
    ],
    [handleShopAllClick, t]
  )

  if (shouldRedirect && redirectSlug) {
    return <Navigate to={`/collection/${redirectSlug}`} replace />
  }

  return (
    <div className="shoes-home-page">
      {/* Hero Slider */}
      <HeroSlider slides={heroSlides} />

      {/* 4-Card Collection Sub-Banner */}
      <CollectionSubBanner
        heading={t('collectionSubBanner.shoesHeading', { defaultValue: 'Shop by Style' })}
        items={shoesCollectionCards}
      />

      {/* Product Section */}
      <section className="product-area-section" id="catalog-grid" aria-label={t('common.products')}>
        <div className="product-area-container">
          {/* Heading Row */}
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

          {/* Pagination */}
          <Pagination
            currentPage={paginatedData.page}
            totalPages={paginatedData.totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </section>

      {/* About S90 Sport */}
      <AboutSection />

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        pageType="shoe"
        products={allShoes}
        activeFilters={activeFilters}
        sort={sort}
        onApply={handleApplyDrawer}
        triggerButtonRef={filtersButtonRef}
      />
    </div>
  )
}
