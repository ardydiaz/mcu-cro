import { Navigate, Route, Routes } from 'react-router-dom'
import AuthProvider from '../auth/AuthProvider.jsx'
import RequireRole from '../auth/RequireRole.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'
import { ROLES } from '../constants/roles.js'
import LoginPage from './auth/LoginPage.jsx'
import DashboardPage from './dashboard/DashboardPage.jsx'
import SettingsPage from './settings/SettingsPage.jsx'
import AdminComingSoon from './AdminComingSoon.jsx'
import { ADMIN_PAGES } from './adminNav.js'
import './admin.css'

const PAGES = { dashboard: DashboardPage, settings: SettingsPage }

// Everything under /admin. Lazy-loaded by the main router, so the public
// site never downloads admin code or checks for a session.
export default function AdminApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route
          element={
            <RequireRole roles={[ROLES.ADMIN, ROLES.STAFF]}>
              <AdminLayout />
            </RequireRole>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
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
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
