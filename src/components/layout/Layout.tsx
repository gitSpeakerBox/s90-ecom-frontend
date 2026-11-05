import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import './Layout.css'

const HERO_ROUTES = new Set(['/', '/jerseys', '/shoes'])

export const Layout = () => {
  const location = useLocation()
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/'
  const hasHero = HERO_ROUTES.has(normalizedPath)

  return (
    <div className={`app-layout ${hasHero ? 'has-hero' : 'no-hero'}`}>
      <Header hasHero={hasHero} />
      <main className={`app-content ${hasHero ? 'has-hero' : 'no-hero'}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
