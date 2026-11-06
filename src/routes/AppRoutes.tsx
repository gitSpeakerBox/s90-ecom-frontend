import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Landing } from '../pages/home/Landing'
import { JerseysHome } from '../pages/home/JerseysHome'
import { ShoesHome } from '../pages/home/ShoesHome'
import { CollectionListing } from '../pages/catalog/CollectionListing'
import { ProductDetailPlaceholder } from '../pages/catalog/ProductDetailPlaceholder'
import { Orders } from '../pages/account/Orders'
import { Login } from '../pages/auth/Login'
import { Wishlist } from '../pages/account/Wishlist'
import { Checkout } from '../pages/checkout/Checkout'
import { NotFound } from '../pages/errors/NotFound'

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
