import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { CircleCheck, LogOut, Menu, Store, X } from 'lucide-react'
import { ADMIN_NAV, adminPath } from '../routes/navConfig'
import { useAdminData } from '../context/AdminDataContext'
import { useNewOrders } from '../hooks/useNewOrders'
import './AdminLayout.css'

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const newOrderCount = useNewOrders().length
  return (
    <aside className={`adm-sidebar ${open ? 'is-open' : ''}`} aria-label="Admin navigation">
      <div className="adm-sidebar__brand">
        <Link to={adminPath('')} className="adm-brand" aria-label="S90 SPORT Admin — Dashboard">
          <span className="adm-brand__bold">S90</span>
          <span className="adm-brand__light">SPORT</span>
        </Link>
        <span className="adm-brand__tag">Admin</span>
        <button type="button" className="adm-icon-btn adm-sidebar__close" onClick={onClose} aria-label="Close menu">
          <X size={18} />
        </button>
      </div>

      <nav className="adm-sidebar__nav">
        <span className="adm-sidebar__heading">Manage</span>
        <ul>
          {ADMIN_NAV.map(({ label, path, icon: Icon }) => (
            <li key={label}>
              <NavLink
                to={adminPath(path)}
                end={path === ''}
                className={({ isActive }) => `adm-nav-link ${isActive ? 'is-active' : ''}`}
              >
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                <span>{label}</span>
                {path === 'orders' && newOrderCount > 0 && (
                  <span className="adm-nav-badge adm-num" aria-label={`${newOrderCount} new orders`}>
                    {newOrderCount > 99 ? '99+' : newOrderCount}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="adm-sidebar__footer">
        <div className="adm-profile">
          <span className="adm-profile__avatar" aria-hidden="true">
            AD
          </span>
          <div className="adm-profile__text">
            <span className="adm-profile__name">Admin preview</span>
            <span className="adm-profile__meta">Sign-in not connected yet</span>
          </div>
        </div>
        <Link to="/" className="adm-sidebar__exit">
          <LogOut size={16} aria-hidden="true" />
          Exit admin
        </Link>
      </div>
    </aside>
  )
}

function Toast() {
  const { notice, dismissNotice } = useAdminData()
  if (!notice) return null
  return (
    <div className="adm-toast" role="status" key={notice.id}>
      <CircleCheck size={16} aria-hidden="true" />
      <span style={{ flex: 1 }}>{notice.message}</span>
      <button type="button" className="adm-icon-btn" onClick={dismissNotice} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  )
}

export function AdminLayout() {
  const location = useLocation()
  // The mobile drawer is open only for the path it was opened on, so any
  // navigation closes it without an effect.
  const [openedOn, setOpenedOn] = useState<string | null>(null)
  const menuOpen = openedOn === location.pathname
  const setMenuOpen = (open: boolean) => setOpenedOn(open ? location.pathname : null)

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenedOn(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const current =
    ADMIN_NAV.find((n) => n.path && location.pathname.startsWith(adminPath(n.path)))?.label ?? 'Dashboard'

  return (
    <div className={`adm-root ${menuOpen ? 'is-menu-open' : ''}`}>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      {menuOpen && <div className="adm-scrim" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <div className="adm-main">
        <header className="adm-topbar">
          <button
            type="button"
            className="adm-icon-btn adm-topbar__menu"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <Menu size={20} />
          </button>
          <div className="adm-topbar__crumbs">
            <span className="adm-muted">Admin</span>
            <span className="adm-muted" aria-hidden="true">
              /
            </span>
            <span className="adm-topbar__current">{current}</span>
          </div>
          <div className="adm-topbar__right">
            <Link to="/" className="adm-btn adm-btn--sm adm-topbar__store">
              <Store size={15} aria-hidden="true" />
              <span>HOME</span>
            </Link>
          </div>
        </header>

        <main className="adm-content" id="admin-main">
          <Outlet />
        </main>
      </div>
      <Toast />
    </div>
  )
}
