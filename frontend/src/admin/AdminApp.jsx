import { Navigate, Route, Routes } from 'react-router-dom'
import AuthProvider from '../auth/AuthProvider.jsx'
import RequireRole from '../auth/RequireRole.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'
import { ALL_ROLES } from '../constants/roles.js'
import LoginPage from './auth/LoginPage.jsx'
import BeneficiariesPage from './beneficiaries/BeneficiariesPage.jsx'
import ContentPage from './cms/ContentPage.jsx'
import DashboardPage from './dashboard/DashboardPage.jsx'
import ReferralsPage from './referrals/ReferralsPage.jsx'
import ReportsPage from './reports/ReportsPage.jsx'
import ServiceRecordsPage from './service-records/ServiceRecordsPage.jsx'
import SettingsPage from './settings/SettingsPage.jsx'
import AdminComingSoon from './AdminComingSoon.jsx'
import { ADMIN_PAGES } from './adminNav.js'
import './admin.css'
import './admin-ui.css'
import './shared/records.css'

const PAGES = {
  dashboard: DashboardPage,
  beneficiaries: BeneficiariesPage,
  'service-records': ServiceRecordsPage,
  referrals: ReferralsPage,
  reports: ReportsPage,
  cms: ContentPage,
  settings: SettingsPage,
}

// Everything under /admin. Lazy-loaded by the main router, so the public
// site never downloads admin code or checks for a session.
export default function AdminApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route
          element={
            <RequireRole roles={ALL_ROLES}>
              <AdminLayout />
            </RequireRole>
          }
        >
          {/* Absolute targets: relative ones resolve against the URL on splat routes and can loop. */}
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          {ADMIN_PAGES.map(({ path, label, roles }) => {
            const Page = PAGES[path]
            return (
              <Route
                key={path}
                path={`${path}/*`}
                element={<RequireRole roles={roles}>{Page ? <Page /> : <AdminComingSoon title={label} />}</RequireRole>}
              />
            )
          })}
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
