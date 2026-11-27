/* oxlint-disable react/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { findProductBySlug, productSlugExists } from '../services/productService'
import {
  getProductAvailabilityVersion,
  subscribeProductAvailability,
} from '../../shared/services/productAvailability'
import { useToast } from './ToastContext'

export interface WishlistContextType {
  items: string[]
  wishlistCount: number
  isInWishlist: (slug: string) => boolean
  addToWishlist: (slug: string, index?: number) => void
  removeFromWishlist: (slug: string) => void
  toggleWishlist: (slug: string) => void
  clearWishlist: () => void
  removeEntry: (slug: string) => void
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export const STORAGE_KEY_WISHLIST = 's90_wishlist_items'

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { showToast } = useToast()

  const [items, setItems] = useState<string[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY_WISHLIST)
        if (saved) {
          const parsed: unknown = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            const slugs: string[] = parsed
              .map((item: unknown) => {
                if (typeof item === 'string') return item
                if (item && typeof item === 'object' && 'slug' in item) {
                  return String((item as { slug: string }).slug)
                }
                return ''
              })
              .filter(Boolean)
            // Remove entries whose product no longer exists. Blocked products still
            // exist: they are kept (hidden below) so they return when unblocked.
            return slugs.filter((slug) => productSlugExists(slug))
          }
        }
      }
    } catch {
      // localStorage unavailable (e.g. incognito)
    }
    return []
  })

  // Persist items to localStorage whenever they change
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify(items))
      }
    } catch {
      // ignore
    }
  }, [items])

  const isInWishlist = useCallback(
    (slug: string): boolean => items.includes(slug),
    [items]
  )

  const addToWishlist = useCallback(
    (slug: string, index?: number) => {
      if (!slug) return
      if (items.includes(slug)) return
      setItems((prev) => {
        if (prev.includes(slug)) return prev
        if (index !== undefined && index >= 0 && index <= prev.length) {
          const next = [...prev]
          next.splice(index, 0, slug)
          return next
        }
        return [slug, ...prev]
      })
      showToast('toast.wishlistAdded')
    },
    [items, showToast]
  )

  const removeFromWishlist = useCallback(
    (slug: string) => {
      if (!slug) return
      if (!items.includes(slug)) return
      setItems((prev) => prev.filter((s) => s !== slug))
      showToast('toast.wishlistRemoved')
    },
    [items, showToast]
  )

  const removeEntry = useCallback((slug: string) => {
    setItems((prev) => prev.filter((s) => s !== slug))
  }, [])

  const toggleWishlist = useCallback(
    (slug: string) => {
      if (!slug) return
      if (items.includes(slug)) {
        setItems((prev) => prev.filter((s) => s !== slug))
        showToast('toast.wishlistRemoved')
      } else {
        setItems((prev) => [slug, ...prev])
        showToast('toast.wishlistAdded')
      }
    },
    [items, showToast]
  )

  const clearWishlist = useCallback(() => {
    setItems([])
  }, [])

  // Hide entries for products the admin has blocked (re-renders on change).
  useSyncExternalStore(subscribeProductAvailability, getProductAvailabilityVersion)
  const visibleItems = items.filter((slug) => Boolean(findProductBySlug(slug)))

  return (
    <WishlistContext.Provider
      value={{
        items: visibleItems,
        wishlistCount: visibleItems.length,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        clearWishlist,
        removeEntry,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}

