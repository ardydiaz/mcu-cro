import { Link } from 'react-router-dom'
import { HiArrowRight } from 'react-icons/hi'
import {
  HiOutlineUserGroup,
  HiOutlineClipboardDocumentList,
  HiOutlineArrowsRightLeft,
  HiOutlineDocumentCheck,
} from 'react-icons/hi2'
import useCurrentUser from '../../auth/useCurrentUser.js'
import { ADMIN_PAGES } from '../adminNav.js'

// Figures come from /api/admin/dashboard once the database is in place.
const KPIS = [
  { label: 'Beneficiaries', Icon: HiOutlineUserGroup },
  { label: 'Service records this month', Icon: HiOutlineClipboardDocumentList },
  { label: 'Open referrals', Icon: HiOutlineArrowsRightLeft },
  { label: 'Content awaiting approval', Icon: HiOutlineDocumentCheck },
]

const greeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const { user, hasRole } = useCurrentUser()
  const firstName = user.name?.split(' ')[0] ?? ''
  const shortcuts = ADMIN_PAGES.filter((page) => page.path !== 'dashboard' && hasRole(...page.roles))

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1>
            {greeting()}
            {firstName && `, ${firstName}`}
          </h1>
          <p>Here's an overview of the Community Relations Office.</p>
        </div>
      </div>

      <section className="kpi-grid" aria-label="Key figures">
        {KPIS.map(({ label, Icon }) => (
          <article key={label} className="kpi">
            <span className="kpi__icon">
              <Icon aria-hidden="true" />
            </span>
            <div>
              <span className="kpi__label">{label}</span>
              <strong className="kpi__value">—</strong>
            </div>
          </article>
        ))}
      </section>
      <p className="admin-hint">Figures will appear here once the database is connected.</p>

      <section className="admin-panel">
        <h2>Quick access</h2>
        <div className="shortcut-grid">
          {shortcuts.map(({ path, label, Icon }) => (
            <Link key={path} to={`/admin/${path}`} className="shortcut">
              <span className="shortcut__icon">
                <Icon aria-hidden="true" />
              </span>
              <span>{label}</span>
              <HiArrowRight aria-hidden="true" className="shortcut__arrow" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
