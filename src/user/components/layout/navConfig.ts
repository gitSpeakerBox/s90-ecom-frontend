import { detectSectionFromPath } from '../../context/SectionContext'
import type { CatalogSection } from '../../context/SectionContext'

export interface NavItem {
  id: 'jerseys' | 'shoes' | 'collections' | 'trackOrder'
  path: string
}

/**
 * Returns the navigation links for the desktop navbar and mobile drawer.
 *
 * Rules:
 * - On "/" and Track Order/Orders pages (/track-order, /orders, /track-order/:id):
 *   ONLY JERSEYS, SHOES, TRACK ORDER (no collections link).
 * - On /jerseys and /shoes (and product detail pages belonging to a jersey or shoe):
 *   JERSEYS, SHOES, COLLECTIONS, TRACK ORDER.
 * - On any other page with no known section (cart, wishlist, login, etc.):
 *   ONLY JERSEYS, SHOES, TRACK ORDER.
 */
export function getNavLinks(pathname: string, productSection?: CatalogSection | null): NavItem[] {
  const normalized = pathname.toLowerCase().replace(/\/+$/, '') || '/'

  // Force no collections on landing, track-order, and orders pages
  if (
    normalized === '/' ||
    normalized === '/track-order' ||
    normalized.startsWith('/track-order/') ||
    normalized === '/orders' ||
    normalized.startsWith('/orders/')
  ) {
    return [
      { id: 'jerseys', path: '/jerseys' },
      { id: 'shoes', path: '/shoes' },
      { id: 'trackOrder', path: '/track-order' },
    ]
  }

  const section = productSection !== undefined ? productSection : detectSectionFromPath(pathname)

  if (section === 'jerseys') {
    return [
      { id: 'jerseys', path: '/jerseys' },
      { id: 'shoes', path: '/shoes' },
      { id: 'collections', path: '/jerseys?collection=all' },
      { id: 'trackOrder', path: '/track-order' },
    ]
  }

  if (section === 'shoes') {
    return [
      { id: 'jerseys', path: '/jerseys' },
      { id: 'shoes', path: '/shoes' },
      { id: 'collections', path: '/shoes?collection=all' },
      { id: 'trackOrder', path: '/track-order' },
    ]
  }

  // All other pages with no known section (cart, wishlist, login, etc.)
  return [
    { id: 'jerseys', path: '/jerseys' },
    { id: 'shoes', path: '/shoes' },
    { id: 'trackOrder', path: '/track-order' },
  ]
}
