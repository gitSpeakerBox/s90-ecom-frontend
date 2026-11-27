import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { UserApp } from './user/UserApp'

// The admin area is loaded on demand into its own bundle chunk and is mounted
// outside every storefront provider, layout and the storefront's RTL handling.
const AdminApp = lazy(() => import('./admin/AdminApp'))

/**
 * Root router: splits the application into two independent trees.
 * - /admin/*  → AdminApp (future Admin Dashboard)
 * - /*        → UserApp  (existing customer storefront, unchanged)
 */
function App() {
  return (
    <Routes>
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={null}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route path="/*" element={<UserApp />} />
    </Routes>
  )
}

export default App
