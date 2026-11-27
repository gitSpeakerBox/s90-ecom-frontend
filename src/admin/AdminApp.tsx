import { useLayoutEffect } from 'react'
// Base admin styles first, so component/page stylesheets (imported below via
// the routes) come later in the cascade and can refine them.
import './styles/admin.css'
import { AdminDataProvider } from './context/AdminDataContext'
import { AdminRoutes } from './routes/AdminRoutes'

/**
 * Admin application boundary (mounted by the root App for /admin/*).
 *
 * Isolation guarantees provided here:
 * - None of the storefront providers (locale, auth, cart, wishlist, toast) wrap
 *   this tree, so no IP country detection, cart or customer session runs here.
 * - The storefront's LocaleProvider may have left <html lang="ar" dir="rtl">
 *   from a previous page; the admin forces LTR English while mounted and
 *   restores the previous values when the visitor returns to the storefront.
 * - All admin CSS is scoped to .adm-* classes and lives in this lazily loaded
 *   chunk, so it cannot restyle storefront markup.
 *
 * Data: the admin reads and edits the existing storefront data modules in
 * memory (see src/admin/services). There is no backend, persistence or admin
 * authentication in this phase.
 */
export default function AdminApp() {
  useLayoutEffect(() => {
    const html = document.documentElement
    const previous = { lang: html.lang, dir: html.dir, title: document.title }
    html.lang = 'en'
    html.dir = 'ltr'
    document.title = 'Admin | S90 SPORT'
    return () => {
      html.lang = previous.lang
      html.dir = previous.dir
      document.title = previous.title
    }
  }, [])

  return (
    <AdminDataProvider>
      <AdminRoutes />
    </AdminDataProvider>
  )
}
