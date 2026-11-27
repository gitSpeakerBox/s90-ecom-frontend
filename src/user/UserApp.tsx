import { AppRoutes } from './routes/AppRoutes'
import { LocaleProvider } from './context/LocaleContext'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import { SectionProvider } from './context/SectionContext'
import { CartProvider } from './context/CartContext'
import { CartDrawerProvider } from './context/CartDrawerContext'
import { WishlistProvider } from './context/WishlistContext'
import { CartDrawer } from './components/cart/CartDrawer'
import { QuickAddModal } from './components/common/QuickAddModal'
import { Toast } from './components/common/Toast'
import { ScrollToTop } from './components/common/ScrollToTop'
import './App.css'

/**
 * Customer storefront application.
 * Owns every storefront provider (locale/RTL, auth, cart, wishlist, toast) and
 * the global cart drawer, quick-add modal and toast. Mounted by the root App
 * for every URL outside /admin/*, so none of this is inherited by the admin area.
 */
export function UserApp() {
  return (
    <LocaleProvider>
      <ToastProvider>
        <AuthProvider>
          <SectionProvider>
            <CartProvider>
              <CartDrawerProvider>
                <WishlistProvider>
                  <ScrollToTop />
                  <div className="app-container">
                    <AppRoutes />
                  </div>
                  <CartDrawer />
                  <QuickAddModal />
                  <Toast />
                </WishlistProvider>
              </CartDrawerProvider>
            </CartProvider>
          </SectionProvider>
        </AuthProvider>
      </ToastProvider>
    </LocaleProvider>
  )
}
