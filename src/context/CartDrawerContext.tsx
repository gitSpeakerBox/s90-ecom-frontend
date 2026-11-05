/* oxlint-disable react/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'

export interface CartDrawerContextType {
  isCartDrawerOpen: boolean
  openCartDrawer: (triggerElement?: HTMLElement | null) => void
  closeCartDrawer: () => void
  cartTriggerElement: HTMLElement | null
}

const CartDrawerContext = createContext<CartDrawerContextType | undefined>(
  undefined
)

export const CartDrawerProvider = ({ children }: { children: ReactNode }) => {
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false)
  const [cartTriggerElement, setCartTriggerElement] =
    useState<HTMLElement | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  const openCartDrawer = useCallback(
    (triggerElement?: HTMLElement | null) => {
      const activeEl =
        triggerElement ??
        (typeof document !== 'undefined'
          ? (document.activeElement as HTMLElement)
          : null) ??
        (typeof document !== 'undefined'
          ? document.getElementById('nav-cart-btn')
          : null)

      triggerRef.current = activeEl
      setCartTriggerElement(activeEl)
      setIsCartDrawerOpen(true)
    },
    []
  )

  const closeCartDrawer = useCallback(() => {
    setIsCartDrawerOpen(false)
  }, [])

  return (
    <CartDrawerContext.Provider
      value={{
        isCartDrawerOpen,
        openCartDrawer,
        closeCartDrawer,
        cartTriggerElement,
      }}
    >
      {children}
    </CartDrawerContext.Provider>
  )
}

export const useCartDrawer = (): CartDrawerContextType => {
  const context = useContext(CartDrawerContext)
  if (!context) {
    throw new Error('useCartDrawer must be used within a CartDrawerProvider')
  }
  return context
}

