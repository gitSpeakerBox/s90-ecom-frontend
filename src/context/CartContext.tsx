/* oxlint-disable react/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import type { Product } from '../types/product'
import { useToast } from './ToastContext'

export interface CartItem {
  productSlug: string
  size?: string | number
  quantity: number
  price: number
  name?: string
  image?: string
  brandOrTeam?: string
}

export interface AddToCartPayload {
  productSlug: string
  size?: string | number
  quantity?: number
  price: number
  name?: string
  image?: string
  brandOrTeam?: string
}

export interface CartContextType {
  items: CartItem[]
  cartCount: number
  addToCart: (payload: AddToCartPayload) => void
  removeFromCart: (productSlug: string, size?: string | number) => void
  updateQuantity: (
    productSlug: string,
    size: string | number | undefined,
    quantity: number
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
      setItems((prevItems) => {
        const existingIndex = prevItems.findIndex(
          (item) =>
            item.productSlug === payload.productSlug &&
            String(item.size ?? '') === String(payload.size ?? '')
        )

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
        }
        return [...prevItems, newItem]
      })

      triggerCartBump()
      showGlobalToast('toast.cartAdded')
    },
    [triggerCartBump, showGlobalToast]
  )

  const removeFromCart = useCallback(
    (productSlug: string, size?: string | number) => {
      const exists = items.some(
        (item) =>
          item.productSlug === productSlug &&
          String(item.size ?? '') === String(size ?? '')
      )
      if (!exists) return

      setItems((prev) =>
        prev.filter(
          (item) =>
            !(
              item.productSlug === productSlug &&
              String(item.size ?? '') === String(size ?? '')
            )
        )
      )
      showGlobalToast('toast.cartRemoved')
    },
    [items, showGlobalToast]
  )

  const updateQuantity = useCallback(
    (
      productSlug: string,
      size: string | number | undefined,
      quantity: number
    ) => {
      if (quantity <= 0) {
        removeFromCart(productSlug, size)
        return
      }
      setItems((prev) =>
        prev.map((item) => {
          if (
            item.productSlug === productSlug &&
            String(item.size ?? '') === String(size ?? '')
          ) {
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

  const cartCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0)

  return (
    <CartContext.Provider
      value={{
        items,
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

