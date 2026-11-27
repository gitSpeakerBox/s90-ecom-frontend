import { allProducts } from '../../shared/data/products'
import { bannerImagePaths } from './bannerAdminService'

/**
 * Image paths already referenced by the existing data (public/images/...).
 * The admin only offers these for selection — it does not upload files.
 */
export function listKnownImages(scope: 'all' | 'banners' | 'products' = 'all'): string[] {
  const set = new Set<string>()
  if (scope !== 'products') for (const p of bannerImagePaths()) set.add(p)
  if (scope !== 'banners') for (const p of allProducts) for (const img of p.images) set.add(img)
  return Array.from(set).filter(Boolean).sort()
}
