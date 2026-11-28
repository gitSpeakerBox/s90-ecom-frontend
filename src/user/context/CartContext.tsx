/* oxlint-disable react/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import type { Product } from '../../shared/types/product'
import {
  getProductAvailabilityVersion,
  subscribeProductAvailability,
} from '../../shared/services/productAvailability'
import { findProductBySlug, productSlugExists } from '../services/productService'
import { useToast } from './ToastContext'

export interface CartItem {
  productSlug: string
  size?: string | number
  quantity: number
  price: number
  name?: string
  image?: string
  brandOrTeam?: string
  addedAt?: number
  /** Chosen product options (e.g. shorts, name & number), shown under the name. Part of the line's identity. */
  options?: string[]
}

export interface AddToCartPayload {
  productSlug: string
  size?: string | number
  quantity?: number
  price: number
  name?: string
  image?: string
  brandOrTeam?: string
  addedAt?: number
  options?: string[]
}

/** Same cart line: same product, size and chosen options. */
export function cartLineKey(item: { productSlug: string; size?: string | number; options?: string[] }): string {
  return [item.productSlug, String(item.size ?? ''), (item.options ?? []).join('|')].join('::')
}

export interface CartContextType {
  items: CartItem[]
  cartCount: number
  addToCart: (payload: AddToCartPayload) => void
  removeFromCart: (productSlug: string, size?: string | number, options?: string[]) => void
  updateQuantity: (
    productSlug: string,
    size: string | number | undefined,
    quantity: number,
    options?: string[]
  ) => void
  clearCart: () => void
  isCartBumped: boolean
  // Quick Add Modal state
  quickAddProduct: Product | null
  isQuickAddOpen: boolean
  quickAddTriggerElement: HTMLElement | null
  openQuickAdd: (product: Product, triggerElement?: HTMLElement | null) => void
  closeQuickAdd: () => void
  // Toast state
  toastMessage: string | null
  isToastVisible: boolean
  showToast: (message: string) => void
  hideToast: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const STORAGE_KEY_CART = 's90_cart_items'

/**
 * A cart line is purchasable unless its product exists but is blocked by the
 * admin. Blocked lines stay in storage (hidden) so they return on unblock.
 */
function isLinePurchasable(productSlug: string): boolean {
  return !productSlugExists(productSlug) || Boolean(findProductBySlug(productSlug))
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const {
    showToast: showGlobalToast,
    hideToast: hideGlobalToast,
    toast: currentToast,
  } = useToast()

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY_CART)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) return parsed
        }
      }
    } catch {
      // localStorage unavailable (e.g. incognito)
    }
    return []
  })

  const [isCartBumped, setIsCartBumped] = useState(false)
  const bumpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Quick Add Modal
  const [quickAddProduct, setQuickAddProduct] = useState<Product | null>(null)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [quickAddTriggerElement, setQuickAddTriggerElement] =
    useState<HTMLElement | null>(null)

  // Persist items to localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(items))
      }
    } catch {
      // ignore
    }
  }, [items])

  const triggerCartBump = useCallback(() => {
    setIsCartBumped(true)
    if (bumpTimerRef.current) clearTimeout(bumpTimerRef.current)
    bumpTimerRef.current = setTimeout(() => {
      setIsCartBumped(false)
    }, 400)
  }, [])

  const addToCart = useCallback(
    (payload: AddToCartPayload) => {
      // Blocked products can never be added, whatever UI triggered the call.
      if (!isLinePurchasable(payload.productSlug)) return
      setItems((prevItems) => {
        const existingIndex = prevItems.findIndex((item) => cartLineKey(item) === cartLineKey(payload))

        if (existingIndex > -1) {
          const updated = [...prevItems]
          const existing = updated[existingIndex]
          updated[existingIndex] = {
            ...existing,
            quantity: existing.quantity + (payload.quantity || 1),
            price: payload.price,
          }
          return updated
        }

        const newItem: CartItem = {
          productSlug: payload.productSlug,
          size: payload.size,
          quantity: payload.quantity || 1,
          price: payload.price,
          name: payload.name,
          image: payload.image,
          brandOrTeam: payload.brandOrTeam,
          addedAt: payload.addedAt ?? Date.now(),
          ...(payload.options?.length ? { options: payload.options } : {}),
        }
        return [newItem, ...prevItems]
      })

      triggerCartBump()
      showGlobalToast('toast.cartAdded')
    },
    [triggerCartBump, showGlobalToast]
  )

  const removeFromCart = useCallback(
    (productSlug: string, size?: string | number, options?: string[]) => {
      const key = cartLineKey({ productSlug, size, options })
      const exists = items.some((item) => cartLineKey(item) === key)
      if (!exists) return

      setItems((prev) => prev.filter((item) => cartLineKey(item) !== key))
      showGlobalToast('toast.cartRemoved')
    },
    [items, showGlobalToast]
  )

  const updateQuantity = useCallback(
    (
      productSlug: string,
      size: string | number | undefined,
      quantity: number,
      options?: string[]
    ) => {
      if (quantity <= 0) {
        removeFromCart(productSlug, size, options)
        return
      }
      const key = cartLineKey({ productSlug, size, options })
      setItems((prev) =>
        prev.map((item) => {
          if (cartLineKey(item) === key) {
            return { ...item, quantity }
          }
          return item
        })
      )
    },
    [removeFromCart]
  )

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const openQuickAdd = useCallback(
    (product: Product, triggerElement?: HTMLElement | null) => {
      setQuickAddProduct(product)
      setQuickAddTriggerElement(triggerElement ?? null)
      setIsQuickAddOpen(true)
    },
    []
  )

  const closeQuickAdd = useCallback(() => {
    setIsQuickAddOpen(false)
  }, [])

  const hideToast = useCallback(() => {
    hideGlobalToast()
  }, [hideGlobalToast])

  const showToast = useCallback(
    (message: string) => {
      showGlobalToast(message)
    },
    [showGlobalToast]
  )

  // Re-render when the admin blocks/unblocks a product (also across tabs).
  useSyncExternalStore(subscribeProductAvailability, getProductAvailabilityVersion)
  // Everything customers see and check out uses only purchasable lines.
  const visibleItems = items.filter((item) => isLinePurchasable(item.productSlug))
  const cartCount = visibleItems.reduce((sum, item) => sum + (item.quantity || 1), 0)

  return (
    <CartContext.Provider
      value={{
        items: visibleItems,
        cartCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartBumped,
        quickAddProduct,
        isQuickAddOpen,
        quickAddTriggerElement,
        openQuickAdd,
        closeQuickAdd,
        toastMessage: currentToast ? currentToast.message : null,
        isToastVisible: Boolean(currentToast),
        showToast,
        hideToast,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = (): CartContextType => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

