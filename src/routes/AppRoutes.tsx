import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Landing } from '../pages/home/Landing'
import { JerseysHome } from '../pages/home/JerseysHome'
import { ShoesHome } from '../pages/home/ShoesHome'
import { CollectionListing } from '../pages/catalog/CollectionListing'
import { ProductDetailPlaceholder } from '../pages/catalog/ProductDetailPlaceholder'
import { Orders } from '../pages/account/Orders'
import { Login } from '../pages/auth/Login'
import { Signup } from '../pages/auth/Signup'
import { ForgotPassword } from '../pages/auth/ForgotPassword'
import { Wishlist } from '../pages/account/Wishlist'
import { Checkout } from '../pages/checkout/Checkout'
import { NotFound } from '../pages/errors/NotFound'
import { ProtectedRoute } from './ProtectedRoute'

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="jerseys" element={<JerseysHome />} />
        <Route path="shoes" element={<ShoesHome />} />
        <Route path="collection/:slug" element={<CollectionListing />} />
        <Route path="collections/:slug" element={<CollectionListing />} />
        <Route path="product/:slug" element={<ProductDetailPlaceholder />} />
        {/* Protected Track Order & Orders Routes */}
        <Route
          path="track-order"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="track-order/:orderId"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders/:orderId"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        {/* Authentication Routes */}
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="register" element={<Navigate to="/signup" replace />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="cart" element={<Navigate to="/checkout" replace />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
