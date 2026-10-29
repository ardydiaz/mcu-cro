import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export const REFRESH_COOKIE = 'cro_rt'
export const LOGIN_STATE_COOKIE = 'cro_login'

// SameSite=Lax: sent on the top-level redirect back from Microsoft, but not on
// cross-site POSTs, which keeps /refresh and /logout safe from CSRF.
export const cookieBase = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'lax',
  path: '/api/auth',
}

// Cookie lifetime follows the refresh token's own expiry.
export function setRefreshCookie(res, refreshToken) {
  const { exp } = jwt.decode(refreshToken)
  res.cookie(REFRESH_COOKIE, refreshToken, { ...cookieBase, expires: new Date(exp * 1000) })
}

export function setLoginStateCookie(res, token) {
  res.cookie(LOGIN_STATE_COOKIE, token, { ...cookieBase, maxAge: 10 * 60 * 1000 })
}
