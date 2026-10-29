import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { HiOutlineMenuAlt3, HiX } from 'react-icons/hi'
import { NAV_LINKS, SITE } from '../../constants/site.js'
import './site-header.css'

export default function SiteHeader() {
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  // The mobile menu remembers the page it was opened on, so it closes itself after navigating.
  const [openOn, setOpenOn] = useState(null)
  const open = openOn === pathname
  const setOpen = (value) => setOpenOn(value ? pathname : null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpenOn(null)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  // Transparent only while sitting on top of the home hero.
  const solid = scrolled || open || pathname !== '/'

  return (
    <header className={`site-header${solid ? ' is-solid' : ''}${open ? ' is-open' : ''}`}>
      <div className="site-header__inner">
        <Link to="/" className="site-header__brand" aria-label={`${SITE.university} ${SITE.name}, home`}>
          <img src="/images/mcu-logo-reverse.png" alt="" width="132" height="48" />
          <span className="site-header__divider" aria-hidden="true" />
          <span className="site-header__office">
            Community
            <br />
            Relations Office
          </span>
        </Link>

        <nav id="site-nav" className="site-nav" aria-label="Main">
          <ul>
            {NAV_LINKS.map(({ to, label }) => (
              <li key={to}>
                <NavLink to={to} end={to === '/'} className="site-nav__link">
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="site-nav__actions">
            <Link to="/give" className="btn btn--gold">
              Give
            </Link>
          </div>
        </nav>

        <button
          type="button"
          className="site-header__toggle"
          aria-expanded={open}
          aria-controls="site-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen(!open)}
        >
          {open ? <HiX /> : <HiOutlineMenuAlt3 />}
        </button>
      </div>
    </header>
  )
}
