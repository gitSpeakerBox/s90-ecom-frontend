import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Landing } from '../pages/Landing'
import { JerseysHome } from '../pages/JerseysHome'
import { ShoesHome } from '../pages/ShoesHome'
import { ProductDetailPlaceholder } from '../pages/ProductDetailPlaceholder'
import { Orders } from '../pages/Orders'
import { Login } from '../pages/Login'
import { Wishlist } from '../pages/Wishlist'
import { Checkout } from '../pages/Checkout'
import { NotFound } from '../pages/NotFound'

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="jerseys" element={<JerseysHome />} />
        <Route path="shoes" element={<ShoesHome />} />
        <Route path="product/:slug" element={<ProductDetailPlaceholder />} />
        <Route path="track-order" element={<Orders />} />
        <Route path="track-order/:orderId" element={<Orders />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:orderId" element={<Orders />} />
        <Route path="login" element={<Login />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="cart" element={<Navigate to="/checkout" replace />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

