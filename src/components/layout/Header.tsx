import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Heart,
  ShoppingBag,
  Menu,
  X,
  Search,
  User,
  ChevronDown,
  Check,
} from 'lucide-react'
import { Logo } from '../common/Logo'
import { TopBar } from './TopBar'
import { ProductCard } from '../products/ProductCard'
import { useAuth } from '../../context/AuthContext'
import { useLocale } from '../../context/LocaleContext'
import { useSection } from '../../context/SectionContext'
import { useCart } from '../../context/CartContext'
import { useCartDrawer } from '../../context/CartDrawerContext'
import { useWishlist } from '../../context/WishlistContext'
import { searchProducts } from '../../services/productService'
import { COLLECTIONS_DATA } from '../../data/collections'
import { getNavLinks } from './navConfig'
import type { NavItem } from './navConfig'
import './Header.css'

export interface HeaderProps {
  hasHero?: boolean
}

const HERO_ROUTES = new Set(['/', '/jerseys', '/shoes'])

export const Header = ({ hasHero: propHasHero }: HeaderProps = {}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false)
  const [collectionsOpen, setCollectionsOpen] = useState(false)
  const [mobileCollectionsOpen, setMobileCollectionsOpen] = useState(false)
  const [drawerCountryOpen, setDrawerCountryOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(
    () => typeof window !== 'undefined' && window.scrollY > 60
  )

  const { user, logout } = useAuth()
  const { language, setLanguage, country, setCountry, countries, t } = useLocale()
  const { activeSection } = useSection()
  const { cartCount, isCartBumped } = useCart()
  const { openCartDrawer } = useCartDrawer()
  const { wishlistCount } = useWishlist()
  const location = useLocation()
  const navigate = useNavigate()
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/'
  const hasHero = propHasHero ?? HERO_ROUTES.has(normalizedPath)

  const matchingProducts = useMemo(
    () => searchProducts(searchQuery, language),
    [searchQuery, language]
  )

  const userMenuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const collectionsRef = useRef<HTMLDivElement>(null)
  const collectionsTriggerRef = useRef<HTMLButtonElement>(null)
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Track scroll position for header solid transition
  useEffect(() => {
    if (!hasHero) return

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [hasHero])

  // Only transparent if no hero dropdown / modal is open, and collections dropdown is closed
  const isTransparent =
    hasHero &&
    !isScrolled &&
    !mobileMenuOpen &&
    !userMenuOpen &&
    !searchOpen &&
    !collectionsOpen

  // Close menus on route change
  const [prevPath, setPrevPath] = useState(location.pathname)
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname)
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
    setSearchOpen(false)
    setSearchQuery('')
    setCollectionsOpen(false)
    setCountryDropdownOpen(false)
    setIsScrolled(typeof window !== 'undefined' && window.scrollY > 60)
  }

  // Focus search input when search is opened
  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus()
    }
  }, [searchOpen])

  // Handle outside click and Escape for dropdowns
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false)
        setSearchOpen(false)
        setSearchQuery('')
        setMobileMenuOpen(false)
        setCollectionsOpen(false)
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false)
      }
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        const target = e.target as HTMLElement
        if (
          !target.closest?.('.quick-add-portal') &&
          !target.closest?.('.quick-add-toast-portal')
        ) {
          setSearchOpen(false)
          setSearchQuery('')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const closeMenu = () => setMobileMenuOpen(false)

  // Collections hover handlers (150ms delay)
  const handleCollectionsMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    openTimerRef.current = setTimeout(() => {
      setUserMenuOpen(false)
      setSearchOpen(false)
      setCollectionsOpen(true)
    }, 150)
  }

  const handleCollectionsMouseLeave = () => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
    closeTimerRef.current = setTimeout(() => {
      setCollectionsOpen(false)
    }, 200)
  }

  const handleCollectionsToggle = () => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current)
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    setCollectionsOpen((prev) => {
      const next = !prev
      if (next) {
        setUserMenuOpen(false)
        setSearchOpen(false)
      }
      return next
    })
  }

  const handleCollectionsTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setUserMenuOpen(false)
      setSearchOpen(false)
      setCollectionsOpen(true)
      setTimeout(() => {
        const firstLink = collectionsRef.current?.querySelector<HTMLAnchorElement>('.collections-link')
        firstLink?.focus()
      }, 50)
    }
  }

  const handleCollectionsPanelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setCollectionsOpen(false)
      collectionsTriggerRef.current?.focus()
    } else if (
      e.key === 'ArrowRight' || e.key === 'ArrowLeft' ||
      e.key === 'ArrowDown' || e.key === 'ArrowUp'
    ) {
      e.preventDefault()
      const links = Array.from(
        collectionsRef.current?.querySelectorAll<HTMLAnchorElement>('.collections-link') || []
      )
      if (links.length === 0) return
      const activeEl = document.activeElement as HTMLAnchorElement
      const currentIndex = links.indexOf(activeEl)
      const isForward = e.key === 'ArrowRight' || e.key === 'ArrowDown'
      if (isForward) {
        const nextIndex = (currentIndex + 1) % links.length
        links[nextIndex]?.focus()
      } else {
        const prevIndex = (currentIndex - 1 + links.length) % links.length
        links[prevIndex]?.focus()
      }
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (matchingProducts.length > 0) {
      const topMatch = matchingProducts[0]
      setSearchOpen(false)
      setSearchQuery('')
      navigate(`/product/${topMatch.slug}`)
    }
  }

  const handleClearSearch = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSearchQuery('')
    searchInputRef.current?.focus()
  }

  const handleResultClick = () => {
    setSearchOpen(false)
    setSearchQuery('')
  }

  const handleCardClick = (slug: string, e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    // If the click was on an action button (wishlist or quick add), let the button handle it
    if (target.closest('button')) return
    setSearchOpen(false)
    setSearchQuery('')
    navigate(`/product/${slug}`)
  }

  const handleToggleSearch = () => {
    setSearchOpen((prev) => {
      const next = !prev
      if (next) {
        setUserMenuOpen(false)
        setCollectionsOpen(false)
        setMobileMenuOpen(false)
      } else {
        setSearchQuery('')
      }
      return next
    })
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const firstResult = searchRef.current?.querySelector<HTMLAnchorElement>('.product-card-link-hitbox')
      firstResult?.focus()
    }
  }

  const handleResultsKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setSearchOpen(false)
      setSearchQuery('')
      searchInputRef.current?.focus()
    }
  }

  const isItemActive = (item: NavItem) => {
    if (item.id === 'jerseys') {
      return (
        location.pathname === '/jerseys' &&
        !location.search.includes('sort=new') &&
        !location.search.includes('category=Track Order') &&
        !location.search.includes('Track Order=true')
      )
    }
    if (item.id === 'shoes') {
      return (
        location.pathname === '/shoes' &&
        !location.search.includes('collection=all')
      )
    }
    if (item.id === 'collections') {
      return collectionsOpen
    }
    if (item.id === 'trackOrder') {
      return (
        location.pathname === '/track-order' ||
        location.pathname === '/orders' ||
        location.pathname.startsWith('/track-order/') ||
        location.pathname.startsWith('/orders/')
      )
    }
    return false
  }

  // Derive nav links based on route and active section
  const navLinks = getNavLinks(location.pathname, activeSection)

  return (
    <div
      className={`site-header-wrapper ${hasHero ? 'has-hero' : 'no-hero'} ${
        isScrolled ? 'is-scrolled' : ''
      } ${isTransparent ? 'is-transparent' : 'is-solid'}`}
    >
      <TopBar
        dropdownOpen={countryDropdownOpen}
        onDropdownChange={setCountryDropdownOpen}
      />
      <header className={`site-header ${isTransparent ? 'is-transparent' : 'is-solid'}`}>
        <div className="header-left">
          {/* Mobile hamburger toggle (far-left on mobile, before S90SPORT logo) */}
          <button
            type="button"
            className="header-icon-btn header-mobile-toggle"
            aria-label={mobileMenuOpen ? t('header.closeNavigation') : t('header.openNavigation')}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? (
              <X size={21} strokeWidth={1.5} />
            ) : (
              <Menu size={21} strokeWidth={1.5} />
            )}
          </button>
          <Logo />
        </div>

        {/* Center Links */}
        <nav className="header-nav" aria-label={t('header.mainNavAria')}>
          {navLinks.map((item) => {
            if (item.id === 'collections') {
              return (
                <div
                  key="collections"
                  className="collections-nav-item"
                  ref={collectionsRef}
                  onMouseEnter={handleCollectionsMouseEnter}
                  onMouseLeave={handleCollectionsMouseLeave}
                >
                  <button
                    ref={collectionsTriggerRef}
                    type="button"
                    className={`header-nav-link collections-nav-btn ${collectionsOpen ? 'active' : ''}`}
                    aria-expanded={collectionsOpen}
                    aria-haspopup="true"
                    aria-label={t('nav.collections')}
                    onClick={handleCollectionsToggle}
                    onKeyDown={handleCollectionsTriggerKeyDown}
                  >
                    <span>{t('nav.collections')}</span>
                    <ChevronDown
                      size={13}
                      className={`collections-chevron ${collectionsOpen ? 'open' : ''}`}
                      aria-hidden="true"
                    />
                  </button>

                  {collectionsOpen && (
                    <div
                      className="collections-megabar"
                      role="menu"
                      aria-label={t('nav.collections')}
                      onKeyDown={handleCollectionsPanelKeyDown}
                      onMouseEnter={handleCollectionsMouseEnter}
                      onMouseLeave={handleCollectionsMouseLeave}
                    >
                      <div className="collections-megabar-inner">
                        {/* Jerseys horizontal row */}
                        {activeSection === 'jerseys' && (
                          <ul className="collections-megabar-list" role="none">
                            {COLLECTIONS_DATA.jerseys.items.map((cItem) => (
                              <li key={cItem.id} className="collections-megabar-item" role="none">
                                <Link
                                  to={cItem.link}
                                  className="collections-megabar-link collections-link"
                                  role="menuitem"
                                  onClick={() => setCollectionsOpen(false)}
                                >
                                  {t(cItem.labelKey)}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Shoes horizontal row */}
                        {activeSection === 'shoes' && (
                          <ul className="collections-megabar-list" role="none">
                            {COLLECTIONS_DATA.shoes.items.map((cItem) => (
                              <li key={cItem.id} className="collections-megabar-item" role="none">
                                <Link
                                  to={cItem.link}
                                  className="collections-megabar-link collections-link"
                                  role="menuitem"
                                  onClick={() => setCollectionsOpen(false)}
                                >
                                  {t(cItem.labelKey)}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            }

            const active = isItemActive(item)
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={() => `header-nav-link ${active ? 'active' : ''}`}
              >
                {t(`nav.${item.id}`)}
              </NavLink>
            )
          })}
        </nav>

        {/* Right Action Icons in Order: search, wishlist, cart, user */}
        <div className="header-actions">
          {/* 1. Search */}
          <div className="header-search-container" ref={searchRef}>
            <button
              type="button"
              className={`header-icon-btn ${searchOpen ? 'active' : ''}`}
              aria-label={searchOpen ? t('header.closeSearch') : t('header.openSearch')}
              aria-expanded={searchOpen}
              onClick={handleToggleSearch}
            >
              {searchOpen ? (
                <X size={19} strokeWidth={1.5} />
              ) : (
                <Search size={19} strokeWidth={1.5} />
              )}
            </button>

            {searchOpen && (
              <>
                <div
                  className="header-search-backdrop"
                  onClick={handleToggleSearch}
                  aria-hidden="true"
                />
                <div
                  className="header-search-overlay"
                  role="dialog"
                  aria-label={t('header.searchItems')}
                >
                  <form
                    className="search-form"
                    onSubmit={handleSearchSubmit}
                    role="search"
                  >
                    <div className="search-input-wrapper">
                      <Search size={16} strokeWidth={1.5} className="search-input-icon" aria-hidden="true" />
                      <input
                        ref={searchInputRef}
                        type="search"
                        className="search-input"
                        placeholder={t('header.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        aria-label={t('header.searchItems')}
                        autoComplete="off"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          className="search-clear-btn"
                          onClick={handleClearSearch}
                          aria-label={t('header.clearSearch')}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </form>

                  {/* Dynamic search results grid */}
                  {searchQuery.trim().length > 0 && (
                    <div
                      className="search-results-container"
                      role="region"
                      aria-live="polite"
                      onKeyDown={handleResultsKeyDown}
                    >
                      {matchingProducts.length > 0 ? (
                        <>
                          <div className="search-results-header">
                            <span className="search-results-count">
                              {t('filters.productCount', {
                                count: matchingProducts.length,
                                defaultValue: `${matchingProducts.length} ${
                                  matchingProducts.length === 1 ? 'product' : 'products'
                                }`,
                              })}
                            </span>
                          </div>
                          <div className="search-results-grid" role="list">
                            {matchingProducts.map((product) => (
                              <div
                                key={product.id || product._id || product.slug}
                                className="search-results-grid-item"
                                role="listitem"
                                onClick={(e) => handleCardClick(product.slug, e)}
                              >
                                <ProductCard
                                  product={product}
                                  onNavigate={handleResultClick}
                                />
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="search-no-results">
                          <Search
                            size={32}
                            strokeWidth={1.2}
                            className="search-no-results-icon"
                            aria-hidden="true"
                          />
                          <p className="search-no-results-title">
                            {t('header.noProductsFound', {
                              query: searchQuery,
                              defaultValue: `No products found for "${searchQuery}"`,
                            })}
                          </p>
                          <p className="search-no-results-hint">
                            {language === 'ar'
                              ? 'جرّب البحث بكلمات أخرى أو تحقق من كتابة الكلمة'
                              : 'Try searching with different keywords or check your spelling'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* 2. Wishlist (Heart) with count badge */}
          <Link
            to="/wishlist"
            className="header-icon-btn header-badge-btn"
            aria-label={t(wishlistCount === 1 ? 'header.wishlistAria_one' : 'header.wishlistAria_other', {
              count: wishlistCount,
            })}
          >
            <Heart size={19} strokeWidth={1.5} />
            <span className="header-badge">{wishlistCount}</span>
          </Link>

          {/* 3. Add to Cart (Bag) with count badge */}
          <button
            type="button"
            id="nav-cart-btn"
            className="header-icon-btn header-badge-btn"
            onClick={() => openCartDrawer()}
            aria-label={t(cartCount === 1 ? 'header.cartAria_one' : 'header.cartAria_other', {
              count: cartCount,
              defaultValue: `Shopping bag (${cartCount} items)`,
            })}
          >
            <ShoppingBag size={19} strokeWidth={1.5} />
            <span
              className={`header-badge ${isCartBumped ? 'header-badge-bump' : ''}`}
            >
              {cartCount}
            </span>
          </button>

          {/* 4. User / Account Icon + Dropdown */}
          <div className="header-user-container" ref={userMenuRef}>
            <button
              type="button"
              className={`header-icon-btn ${userMenuOpen ? 'active' : ''}`}
              aria-label={t('header.customerAccountMenu')}
              aria-haspopup="true"
              aria-expanded={userMenuOpen}
              onClick={() => setUserMenuOpen((prev) => !prev)}
            >
              <User size={19} strokeWidth={1.5} />
            </button>

            {userMenuOpen && (
              <div
                className="user-dropdown-panel"
                role="menu"
                aria-label={t('header.accountOptions')}
              >
                {user ? (
                  <div className="user-dropdown-content">
                    <span className="user-dropdown-name">
                      {t('header.helloUser', { name: user.name })}
                    </span>
                    <Link
                      to="/orders"
                      className="user-dropdown-item"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {t('header.myOrders')}
                    </Link>
                    <button
                      type="button"
                      className="user-dropdown-item user-dropdown-signout"
                      role="menuitem"
                      onClick={() => {
                        logout()
                        setUserMenuOpen(false)
                      }}
                    >
                      {t('header.signOut')}
                    </button>
                  </div>
                ) : (
                  <div className="user-dropdown-content">
                    <span className="user-dropdown-greeting">{t('header.helloGuest')}</span>
                    <Link
                      to="/login"
                      className="user-dropdown-login-btn"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {t('header.login')}
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="mobile-nav-container">
          <div
            className="mobile-nav-backdrop"
            onClick={closeMenu}
            aria-hidden="true"
          />
          <aside
            className="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t('header.mobileNavAria')}
          >
            <div className="mobile-nav-header">
              <Logo />
              <button
                type="button"
                className="header-icon-btn"
                onClick={closeMenu}
                aria-label={t('header.closeMenu')}
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <ul className="mobile-nav-links">
              {navLinks.map((item) => {
                if (item.id === 'collections') {
                  return (
                    <li key="collections" className="mobile-nav-item mobile-accordion-item">
                      <button
                        type="button"
                        className="mobile-nav-link mobile-accordion-trigger"
                        onClick={() => setMobileCollectionsOpen((prev) => !prev)}
                        aria-expanded={mobileCollectionsOpen}
                      >
                        <span>{t('nav.collections')}</span>
                        <ChevronDown
                          size={16}
                          className={`mobile-accordion-chevron ${mobileCollectionsOpen ? 'open' : ''}`}
                          aria-hidden="true"
                        />
                      </button>

                      {mobileCollectionsOpen && (
                        <div className="mobile-accordion-panel">
                          {/* Jerseys group */}
                          {activeSection === 'jerseys' && (
                            <div className="mobile-accordion-group">
                              <ul className="mobile-accordion-list">
                                {COLLECTIONS_DATA.jerseys.items.map((cItem) => (
                                  <li key={cItem.id}>
                                    <Link
                                      to={cItem.link}
                                      className="mobile-accordion-link"
                                      onClick={closeMenu}
                                    >
                                      {t(cItem.labelKey)}
                                    </Link>
                                  </li>
                                ))}
                                <li>
                                  <Link
                                    to={COLLECTIONS_DATA.jerseys.viewAllLink}
                                    className="mobile-accordion-link mobile-accordion-view-all"
                                    onClick={closeMenu}
                                  >
                                    {t(COLLECTIONS_DATA.jerseys.viewAllKey)} →
                                  </Link>
                                </li>
                              </ul>
                            </div>
                          )}

                          {/* Shoes group */}
                          {activeSection === 'shoes' && (
                            <div className="mobile-accordion-group">
                              <ul className="mobile-accordion-list">
                                {COLLECTIONS_DATA.shoes.items.map((cItem) => (
                                  <li key={cItem.id}>
                                    <Link
                                      to={cItem.link}
                                      className="mobile-accordion-link"
                                      onClick={closeMenu}
                                    >
                                      {t(cItem.labelKey)}
                                    </Link>
                                  </li>
                                ))}
                                <li>
                                  <Link
                                    to={COLLECTIONS_DATA.shoes.viewAllLink}
                                    className="mobile-accordion-link mobile-accordion-view-all"
                                    onClick={closeMenu}
                                  >
                                    {t(COLLECTIONS_DATA.shoes.viewAllKey)} →
                                  </Link>
                                </li>
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  )
                }

                const active = isItemActive(item)
                return (
                  <li key={item.id}>
                    <NavLink
                      to={item.path}
                      className={() => `mobile-nav-link ${active ? 'active' : ''}`}
                      onClick={closeMenu}
                    >
                      {t(`nav.${item.id}`)}
                    </NavLink>
                  </li>
                )
              })}
            </ul>

            {/* Mobile Footer: Top-bar language and country choices */}
            <div className="mobile-nav-footer">
              <div className="mobile-footer-section">
                <span className="mobile-footer-label">{t('header.language')}</span>
                <div className="mobile-lang-switch">
                  <button
                    type="button"
                    className={`mobile-lang-btn ${language === 'en' ? 'active' : ''}`}
                    onClick={() => setLanguage('en')}
                  >
                    {t('topBar.english')}
                  </button>
                  <span className="lang-divider">/</span>
                  <button
                    type="button"
                    className={`mobile-lang-btn ${language === 'ar' ? 'active' : ''}`}
                    onClick={() => setLanguage('ar')}
                  >
                    {t('topBar.arabic')}
                  </button>
                </div>
              </div>

              <div className="mobile-footer-section">
                <span className="mobile-footer-label">{t('header.shipTo')}</span>
                <button
                  type="button"
                  className="mobile-country-trigger"
                  onClick={() => setDrawerCountryOpen((prev) => !prev)}
                  aria-expanded={drawerCountryOpen}
                >
                  <span className="country-flag">{country.flag}</span>
                  <span className="mobile-country-name">
                    {t(`topBar.countries.${country.code}`, { defaultValue: country.name })}
                  </span>
                  <ChevronDown
                    size={13}
                    className={`mobile-chevron ${drawerCountryOpen ? 'open' : ''}`}
                  />
                </button>

                {drawerCountryOpen && (
                  <div className="mobile-country-list">
                    {countries.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        className={`mobile-country-option ${
                          c.name === country.name ? 'selected' : ''
                        }`}
                        onClick={() => {
                          setCountry(c)
                          setDrawerCountryOpen(false)
                        }}
                      >
                        <span className="country-flag">{c.flag}</span>
                        <span>
                          {t(`topBar.countries.${c.code}`, { defaultValue: c.name })}
                        </span>
                        {c.name === country.name && (
                          <Check size={14} className="mobile-country-check" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
