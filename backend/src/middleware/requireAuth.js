import { verifyAccessToken } from '../auth/tokens.js'
import { HttpError } from '../utils/httpError.js'

// Verifies `Authorization: Bearer <access token>` and sets req.user.
export default function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ')
  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Missing bearer token'))
  }

  try {
    const payload = verifyAccessToken(token)
    req.user = { id: payload.sub, email: payload.email, roles: payload.roles ?? [] }
    next()
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token'
    next(new HttpError(401, message))
  }
}
