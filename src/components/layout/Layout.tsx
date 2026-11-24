import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import './Layout.css'

const HERO_ROUTES = new Set(['/', '/jerseys', '/shoes'])
const AUTH_ROUTES = new Set(['/login', '/signup', '/forgot-password', '/register'])

export const Layout = () => {
  const location = useLocation()
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/'
  const hasHero = HERO_ROUTES.has(normalizedPath)
  const isAuthPage = AUTH_ROUTES.has(normalizedPath)

  return (
    <div className={`app-layout ${hasHero ? 'has-hero' : 'no-hero'} ${isAuthPage ? 'auth-layout' : ''}`}>
      <Header hasHero={hasHero} />
      <main className={`app-content ${hasHero ? 'has-hero' : 'no-hero'} ${isAuthPage ? 'auth-content' : ''}`}>
        <Outlet />
      </main>
      {!isAuthPage && <Footer />}
    </div>
  )
}
