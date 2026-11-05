/* oxlint-disable react/only-export-components */
import React, { createContext, useContext, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { findProductBySlug } from '../services/productService'

export type CatalogSection = 'jerseys' | 'shoes'

export interface SectionContextValue {
  /**
   * The effective section to display in Collections:
   * 'jerseys', 'shoes', or null (no section).
   */
  activeSection: CatalogSection | null
  lastVisitedSection: CatalogSection | null
  setSection: (section: CatalogSection | null) => void
}

const SectionContext = createContext<SectionContextValue | undefined>(undefined)

export function detectSectionFromPath(pathname: string): CatalogSection | null {
  const normalized = pathname.toLowerCase().replace(/\/+$/, '') || '/'

  if (normalized === '/jerseys' || normalized.startsWith('/jerseys/')) {
    return 'jerseys'
  }

  if (normalized === '/shoes' || normalized.startsWith('/shoes/')) {
    return 'shoes'
  }

  if (normalized.startsWith('/product/')) {
    const slug = normalized.replace('/product/', '').split('/')[0]
    if (slug) {
      const prod = findProductBySlug(slug)
      if (prod?.productType === 'jersey') return 'jerseys'
      if (prod?.productType === 'shoe') return 'shoes'
    }
  }

  return null
}

export const SectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()

  const activeSection = useMemo(() => {
    return detectSectionFromPath(location.pathname)
  }, [location.pathname])

  const value = useMemo(
    () => ({
      activeSection,
      lastVisitedSection: activeSection,
      setSection: () => {},
    }),
    [activeSection]
  )

  return <SectionContext.Provider value={value}>{children}</SectionContext.Provider>
}

export function useSection(): SectionContextValue {
  const context = useContext(SectionContext)
  if (!context) {
    throw new Error('useSection must be used within a SectionProvider')
  }
  return context
}
