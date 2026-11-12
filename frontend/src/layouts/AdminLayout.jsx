import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { HiOutlineMenuAlt2, HiX, HiOutlineExternalLink, HiOutlineLogout, HiChevronDown } from 'react-icons/hi'
import IdleTimeout from '../auth/IdleTimeout.jsx'
import useCurrentUser from '../auth/useCurrentUser.js'
import { ADMIN_NAV, ADMIN_PAGES } from '../admin/adminNav.js'
import { ROLE_LABELS } from '../constants/roles.js'

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

export default function AdminLayout() {
  const { user, hasRole, signOut } = useCurrentUser()
  const { pathname } = useLocation()

  // Both menus remember the page they were opened on, so they close after navigating.
  const [sidebarOn, setSidebarOn] = useState(null)
  const [menuOn, setMenuOn] = useState(null)
  const sidebarOpen = sidebarOn === pathname
  const menuOpen = menuOn === pathname
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e) => !menuRef.current?.contains(e.target) && setMenuOn(null)
    const onKey = (e) => e.key === 'Escape' && setMenuOn(null)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const current = ADMIN_PAGES.find((page) => pathname.startsWith(`/admin/${page.path}`))
  const roleLabel = [...user.roles.map((role) => ROLE_LABELS[role] ?? role), user.college?.code].filter(Boolean).join(' · ')

  return (
    <div className={`admin${sidebarOpen ? ' is-sidebar-open' : ''}`}>
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <div className="admin-sidebar__brand">
          <img src="/images/mcu-logo-reverse.png" alt="MCU" width="110" height="40" />
          <span>CRO Admin</span>
        </div>

        <nav className="admin-sidebar__nav">
          {ADMIN_NAV.map(({ section, items }) => {
            const visible = items.filter((item) => hasRole(...item.roles))
            if (visible.length === 0) return null
            return (
              <div key={section} className="admin-sidebar__group">
                <span className="admin-sidebar__section">{section}</span>
                <ul>
                  {visible.map(({ path, label, Icon }) => (
                    <li key={path}>
                      <NavLink to={`/admin/${path}`} className="admin-sidebar__link">
                        <Icon aria-hidden="true" />
                        {label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </nav>

        <Link to="/" className="admin-sidebar__site">
          <HiOutlineExternalLink aria-hidden="true" /> View website
        </Link>
      </aside>

      <button
        type="button"
        className="admin-backdrop"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={() => setSidebarOn(null)}
      />

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-topbar__toggle"
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOn(sidebarOpen ? null : pathname)}
          >
            {sidebarOpen ? <HiX /> : <HiOutlineMenuAlt2 />}
          </button>
          <span className="admin-topbar__title">{current?.label ?? 'Admin'}</span>

          <div className="admin-user" ref={menuRef}>
            <button
              type="button"
              className="admin-user__button"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOn(menuOpen ? null : pathname)}
            >
              <span className="admin-user__avatar" aria-hidden="true">
                {initials(user.name || user.email)}
              </span>
              <span className="admin-user__meta">
                <strong>{user.name || user.email}</strong>
                <small>{roleLabel}</small>
              </span>
              <HiChevronDown aria-hidden="true" />
            </button>

            {menuOpen && (
              <div className="admin-user__menu" role="menu">
                <div className="admin-user__info">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
                <button type="button" role="menuitem" onClick={() => signOut()}>
                  <HiOutlineLogout aria-hidden="true" /> Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="admin-content" id="main">
          <Outlet />
        </main>
        <IdleTimeout />
      </div>
    </div>
  )
}
