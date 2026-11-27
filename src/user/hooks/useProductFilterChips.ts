import { useMemo, useCallback } from 'react'
import type { AppliedFilterChip } from '../components/products'
import type { ProductFilterOptions } from '../services/productService'

export interface UseProductFilterChipsProps {
  filterState: Omit<ProductFilterOptions, 'category'>
  setFilterState: React.Dispatch<React.SetStateAction<Omit<ProductFilterOptions, 'category'>>>
  setCurrentPage: (page: number) => void
  currency: string
  t: (key: string, options?: Record<string, unknown>) => string
}

export function useProductFilterChips({
  filterState,
  setFilterState,
  setCurrentPage,
  currency,
  t,
}: UseProductFilterChipsProps) {
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
          if (key === 'team') {
            displayVal = t(`filters.teams.${v}`, { defaultValue: String(v) })
          } else if (key === 'type') {
            displayVal = t(`filters.types.${v}`, { defaultValue: String(v) })
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
            if (key === 'team') {
              displayVal = t(`filters.teams.${v}`, { defaultValue: v })
            } else if (key === 'type') {
              displayVal = t(`filters.types.${v}`, { defaultValue: v })
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

  const handleRemoveChip = useCallback(
    (key: string, value: string) => {
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
      setCurrentPage(1)
    },
    [setFilterState, setCurrentPage]
  )

  return { chips, handleRemoveChip }
}

