import { Link } from 'react-router-dom'
import { HiOutlineLocationMarker, HiOutlinePhone, HiOutlineMail } from 'react-icons/hi'
import { NAV_LINKS, SITE, SOCIAL_LINKS } from '../../constants/site.js'
import './site-footer.css'

const YEAR = new Date().getFullYear()

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <img src="/images/mcu-logo-reverse.png" alt={SITE.university} width="176" height="64" />
          <p>
            The {SITE.name} of {SITE.university} supports communities with moral, financial, and
            technological aid.
          </p>
          <ul className="site-footer__social" aria-label="Social media">
            {SOCIAL_LINKS.map(({ href, label, handle, Icon }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noreferrer" aria-label={`${label} (${handle})`} title={`${label} ${handle}`}>
                  <Icon aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="site-footer__title">Explore</h2>
          <ul className="site-footer__links">
            {NAV_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link to={to}>{label}</Link>
              </li>
            ))}
            <li>
              <Link to="/give">Give</Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="site-footer__title">Contact us</h2>
          <ul className="site-footer__contact">
            <li>
              <HiOutlineLocationMarker aria-hidden="true" />
              <address>
                {SITE.address.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </address>
            </li>
            <li>
              <HiOutlinePhone aria-hidden="true" />
              <a href={SITE.phoneHref}>{SITE.phone}</a>
            </li>
            <li>
              <HiOutlineMail aria-hidden="true" />
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="container site-footer__bottom">
        <p>
          © {YEAR} {SITE.university}. All rights reserved.
        </p>
        <p>{SITE.name}</p>
      </div>
    </footer>
  )
}
