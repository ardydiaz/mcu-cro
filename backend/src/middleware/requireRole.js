import { HttpError } from '../utils/httpError.js'

// Usage: router.delete('/x', requireRole(ROLES.CRO_ADMIN), handler)
// Passes if the user has at least one of the given roles.
export default function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) return next(new HttpError(401, 'Not authenticated'))
    if (!req.user.roles.some((role) => allowed.includes(role))) {
      return next(new HttpError(403, 'Forbidden'))
    }
    next()
  }
}
