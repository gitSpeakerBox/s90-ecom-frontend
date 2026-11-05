import React, { useState, useMemo, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext'
import {
  CategoryHero,
  ProductHeader,
  FilterChips,
  FilterDrawer,
  ProductGrid,
  Pagination,
} from '../components/category'
import type { CategoryHeroSlide, AppliedFilterChip } from '../components/category'
import { AboutSection } from '../components/common/AboutSection'
import { CollectionSubBanner } from '../components/common/CollectionSubBanner'
import { jerseyCollectionCards } from '../data/collectionBanners'
import { allJerseys } from '../data/products/catalogData'
import { getPaginatedJerseys, getLocalizedCategory } from '../services/productService'
import type { ProductFilterOptions } from '../services/productService'
import './JerseysHome.css'

export const JerseysHome: React.FC = () => {
  const { t, language, currency } = useLocale()
  const [searchParams, setSearchParams] = useSearchParams()

  const urlCategory = searchParams.get('category') || ''
  const urlSort = searchParams.get('sort') || 'featured'

  const [filterState, setFilterState] = useState<Omit<ProductFilterOptions, 'category'>>({
    team: 'all',
    season: 'all',
    size: 'all',
    color: 'all',
    price: 'all',
  })

  const [sort, setSort] = useState<string>(urlSort)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const filtersButtonRef = useRef<HTMLButtonElement>(null)

  const activeFilters: ProductFilterOptions = useMemo(() => {
    return {
      ...filterState,
      category: urlCategory || 'all',
    }
  }, [filterState, urlCategory])

  // Generate removable chips
  const chips: AppliedFilterChip[] = useMemo(() => {
    const list: AppliedFilterChip[] = []

    if (urlCategory && urlCategory !== 'all') {
      const localizedCategory = getLocalizedCategory(urlCategory, language)
      list.push({
        key: 'category',
        label: `${t('filters.category')}: ${localizedCategory}`,
        value: urlCategory,
      })
    }

    Object.entries(filterState).forEach(([key, val]) => {
      if (!val || val === 'all') return
      const keyLabel = t(`filters.${key}`, {
        defaultValue: key.charAt(0).toUpperCase() + key.slice(1),
      })
      if (Array.isArray(val)) {
        val.forEach((v) => {
          let displayVal = String(v)
          if (key === 'team') {
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
            if (key === 'team') {
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
  }, [urlCategory, filterState, language, currency, t])

  const handleRemoveChip = (key: string, value: string) => {
    if (key === 'category') {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('category')
      setSearchParams(nextParams)
    } else {
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
    }
    setCurrentPage(1)
  }

  const handleClearAll = useCallback(() => {
    setFilterState({
      team: 'all',
      season: 'all',
      size: 'all',
      color: 'all',
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

    // Scroll product grid into view
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
    return getPaginatedJerseys(queryParams)
  }, [queryParams])

  const handleShopAllClick = useCallback(() => {
    handleClearAll()
    const grid = document.getElementById('catalog-grid')
    if (grid) {
      grid.scrollIntoView({ behavior: 'smooth' })
    }
  }, [handleClearAll])

  const handleSelectCollection = useCallback(
    (collectionCategory: string) => {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('category', collectionCategory)
      setSearchParams(nextParams)
      setCurrentPage(1)
      setTimeout(() => {
        const grid = document.getElementById('catalog-grid')
        if (grid) {
          grid.scrollIntoView({ behavior: 'smooth' })
        }
      }, 50)
    },
    [searchParams, setSearchParams]
  )

  const heroSlides: CategoryHeroSlide[] = useMemo(
    () => [
      {
        image: '/images/hero-jerseys-1.png',
        eyebrow: t('hero.jerseysEyebrow'),
        title: t('hero.jerseysTitle'),
        text: t('hero.jerseysDesc'),
        buttonLabel: t('hero.shopAllJerseys'),
        to: '#catalog-grid',
        imageAlt: t('hero.jerseysAlt'),
        onButtonClick: handleShopAllClick,
      },
      {
        image: '/images/hero-jerseys-2.png',
        eyebrow: t('hero.jerseysSlide2Eyebrow'),
        title: t('hero.jerseysSlide2Title'),
        text: t('hero.jerseysSlide2Desc'),
        buttonLabel: t('hero.jerseysSlide2Cta'),
        to: '#catalog-grid',
      },
      {
        image: '/images/hero-jerseys-3.png',
        eyebrow: t('hero.jerseysSlide3Eyebrow'),
        title: t('hero.jerseysSlide3Title'),
        text: t('hero.jerseysSlide3Desc'),
        buttonLabel: t('hero.jerseysSlide3Cta'),
        to: '#catalog-grid',
      },
    ],
    [handleShopAllClick, t]
  )

  return (
    <div className="jerseys-home-page">
      {/* Category Hero */}
      <CategoryHero slides={heroSlides} />

      {/* 4-Card Collection Sub-Banner */}
      <CollectionSubBanner
        heading={t('collectionSubBanner.jerseysHeading', { defaultValue: 'Shop By Collections' })}
        items={jerseyCollectionCards}
        activeCategory={urlCategory}
        onSelectCategory={handleSelectCollection}
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
            hasChips={chips.length > 0}
          />

          {/* Active Filter Chips */}
          <FilterChips
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
        pageType="jersey"
        products={allJerseys}
        activeFilters={activeFilters}
        sort={sort}
        onApply={handleApplyDrawer}
        triggerButtonRef={filtersButtonRef}
      />
    </div>
  )
}
