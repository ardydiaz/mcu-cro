import { verifyAccessToken } from '../auth/tokens.js'
import { getSessionUser, toPublicSessionUser } from '../modules/users/users.service.js'
import { HttpError } from '../utils/httpError.js'

// Verifies `Authorization: Bearer <access token>`, then confirms against the
// database that the account is still active and the token hasn't been revoked.
// Sets req.user = { id, email, name, roles } with roles read fresh from the DB.
export default async function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ')
  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Missing bearer token'))
  }

  let payload
  try {
    payload = verifyAccessToken(token)
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token'
    return next(new HttpError(401, message))
  }

  const user = await getSessionUser(payload.sub, payload.ver)
  if (!user) return next(new HttpError(401, 'Session is no longer valid'))

  req.user = toPublicSessionUser(user)
  next()
}
