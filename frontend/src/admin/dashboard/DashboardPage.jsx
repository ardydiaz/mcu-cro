import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HiArrowRight } from 'react-icons/hi'
import {
  HiOutlineUserGroup,
  HiOutlineClipboardDocumentList,
  HiOutlineArrowsRightLeft,
  HiOutlineCalendarDays,
} from 'react-icons/hi2'
import useCurrentUser from '../../auth/useCurrentUser.js'
import { getDashboard } from '../../api/admin.api.js'
import { ADMIN_PAGES } from '../adminNav.js'

// Figures from /api/admin/dashboard; each card opens the matching filtered list.
const KPIS = [
  { key: 'beneficiaries', label: 'Beneficiaries', Icon: HiOutlineUserGroup, to: '/admin/beneficiaries' },
  { key: 'servicesThisMonth', label: 'Services this month', Icon: HiOutlineClipboardDocumentList, to: '/admin/service-records' },
  { key: 'openReferrals', label: 'Open referrals', Icon: HiOutlineArrowsRightLeft, to: '/admin/referrals?status=open' },
  { key: 'followUpsDue', label: 'Follow-ups due (7 days)', Icon: HiOutlineCalendarDays, to: '/admin/service-records?followUpStatus=scheduled' },
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
  const [figures, setFigures] = useState(null) // null while loading, false on error

  useEffect(() => {
    getDashboard().then(setFigures, () => setFigures(false))
  }, [])

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1>
            {greeting()}
            {firstName && `, ${firstName}`}
          </h1>
          <p>
            Here's an overview of the Community Relations Office
            {user.college && ` for ${user.college.name}`}.
          </p>
        </div>
      </div>

      <section className="kpi-grid" aria-label="Key figures">
        {KPIS.map(({ key, label, Icon, to }) => (
          <Link key={key} to={to} className="kpi">
            <span className="kpi__icon">
              <Icon aria-hidden="true" />
            </span>
            <div>
              <span className="kpi__label">{label}</span>
              <strong className="kpi__value">{figures ? figures[key].toLocaleString() : '—'}</strong>
            </div>
          </Link>
        ))}
      </section>
      {figures === false && <p className="admin-hint">Couldn't load the figures. Please refresh the page.</p>}

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
