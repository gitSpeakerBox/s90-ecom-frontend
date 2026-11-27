import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { AdminLayout } from '../layouts/AdminLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { OrdersPage } from '../pages/OrdersPage'
import { ProductsPage } from '../pages/ProductsPage'
import { BadgesPage } from '../pages/BadgesPage'
import { UsersPage } from '../pages/UsersPage'
import { CollectionsPage } from '../pages/CollectionsPage'
import { HeroBannersPage } from '../pages/HeroBannersPage'
import { SubBannersPage } from '../pages/SubBannersPage'
import { SalesReportsPage } from '../pages/SalesReportsPage'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { adminPath } from './navConfig'

/** Keeps old /admin/collections links (incl. their query string) working. */
function RedirectToCategories() {
  const { search } = useLocation()
  return <Navigate to={`${adminPath('categories')}${search}`} replace />
}

function AdminNotFound() {
  return (
    <Card>
      <EmptyState
        icon={Compass}
        title="Admin page not found"
        text="This admin address does not exist."
        action={
          <Link to={adminPath('')} className="adm-btn adm-btn--primary" style={{ marginTop: 10 }}>
            Go to dashboard
          </Link>
        }
      />
    </Card>
  )
}

/** Routes relative to /admin (mounted by the root App under "/admin/*"). */
export function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="badges" element={<BadgesPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="categories" element={<CollectionsPage />} />
        {/* Former address of the Categories page (was "Collections"). */}
        <Route path="collections" element={<RedirectToCategories />} />
        <Route path="hero-banners" element={<HeroBannersPage />} />
        <Route path="sub-banners" element={<SubBannersPage />} />
        <Route path="sales-reports" element={<SalesReportsPage />} />
        <Route path="*" element={<AdminNotFound />} />
      </Route>
    </Routes>
  )
}
