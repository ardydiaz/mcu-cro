import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useCurrentUser from './useCurrentUser.js'

// Route guard: signed-out users go to the login page; users without one of
// `roles` see a "no access" message. With no `roles`, any signed-in user passes.
export default function RequireRole({ roles = [], children }) {
  const { status, hasRole } = useCurrentUser()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="admin-loading" role="status">
        <span className="admin-spinner" aria-hidden="true" />
        Checking your session…
      </div>
    )
  }

  if (status === 'anonymous') {
    const returnTo = location.pathname + location.search
    return <Navigate to={`/admin/login?returnTo=${encodeURIComponent(returnTo)}`} replace />
  }

  if (roles.length > 0 && !hasRole(...roles)) {
    return (
      <div className="admin-empty">
        <h1>No access</h1>
        <p>Your account doesn't have permission to view this page. Contact the CRO administrator if you need access.</p>
      </div>
    )
  }

  return children ?? <Outlet />
}
