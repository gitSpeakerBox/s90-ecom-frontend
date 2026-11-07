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

function App() {
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

export default App
