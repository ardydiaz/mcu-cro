import { Router } from 'express'
import { env } from '../config/env.js'
import { audit } from '../middleware/auditLog.js'
import { refreshLimiter, signInLimiter } from '../middleware/rateLimit.js'
import requireAuth from '../middleware/requireAuth.js'
import * as usersRepo from '../modules/users/users.repository.js'
import * as usersService from '../modules/users/users.service.js'
import { syncProfilePhoto } from './graphPhoto.js'
import { HttpError } from '../utils/httpError.js'
import { crypto, getMsalClient, SCOPES } from './m365.js'
import { issueTokens, signAccessToken, signLoginState, verifyLoginState, verifyRefreshToken } from './tokens.js'
import {
  cookieBase,
  LOGIN_STATE_COOKIE,
  REFRESH_COOKIE,
  setLoginStateCookie,
  setRefreshCookie,
} from './cookies.js'

const router = Router()

// Only same-site admin paths are allowed as a post-login destination.
const safeReturnTo = (value) =>
  typeof value === 'string' && value.startsWith('/admin') && !value.startsWith('//') ? value : '/admin'

// In development, Microsoft's error code (e.g. AADSTS50011) is passed along so
// the login page can show it; production shows only the friendly message.
const toLoginPage = (error, detail) => {
  const params = new URLSearchParams({ error })
  if (detail && !env.isProduction) params.set('detail', detail)
  return `${env.frontendUrl}/admin/login?${params}`
}

const aadCode = (text = '') => text.match(/AADSTS\d+/)?.[0]

router.use('/m365', signInLimiter)

// Step 1: send the browser to Microsoft's sign-in page.
router.get('/m365/login', async (req, res) => {
  const msal = getMsalClient()
  if (!msal) return res.redirect(toLoginPage('not_configured'))

  const { verifier, challenge } = await crypto.generatePkceCodes()
  const state = crypto.createNewGuid()

  setLoginStateCookie(
    res,
    signLoginState({ state, verifier, returnTo: safeReturnTo(req.query.returnTo) }),
  )

  const url = await msal.getAuthCodeUrl({
    scopes: SCOPES,
    redirectUri: env.m365.redirectUri,
    state,
    codeChallenge: challenge,
    codeChallengeMethod: 'S256',
    prompt: 'select_account',
  })
  res.redirect(url)
})

// Step 2: Microsoft redirects back here with an authorization code.
router.get('/m365/callback', async (req, res) => {
  const msal = getMsalClient()
  if (!msal) return res.redirect(toLoginPage('not_configured'))

  const stateToken = req.cookies[LOGIN_STATE_COOKIE]
  res.clearCookie(LOGIN_STATE_COOKIE, cookieBase)

  if (req.query.error) {
    // e.g. the user cancelled, or isn't assigned to the app.
    console.warn('M365 sign-in error:', req.query.error, req.query.error_description)
    return res.redirect(toLoginPage('m365_error', aadCode(req.query.error_description) ?? req.query.error))
  }

  let login
  try {
    login = verifyLoginState(stateToken)
  } catch {
    return res.redirect(toLoginPage('session_expired'))
  }
  if (!req.query.code || req.query.state !== login.state) {
    return res.redirect(toLoginPage('session_expired'))
  }

  let claims, graphAccessToken
  try {
    const result = await msal.acquireTokenByCode({
      code: req.query.code,
      scopes: SCOPES,
      redirectUri: env.m365.redirectUri,
      codeVerifier: login.verifier,
    })
    claims = result.idTokenClaims
    graphAccessToken = result.accessToken
  } catch (err) {
    console.error('M365 token exchange failed:', err)
    return res.redirect(toLoginPage('m365_error', aadCode(err.errorMessage ?? err.message) ?? err.errorCode))
  }

  if (claims.tid !== env.m365.tenantId) return res.redirect(toLoginPage('wrong_tenant'))

  // Microsoft 365 proves who the person is; the users table decides whether
  // they get in and with which role.
  const email = String(claims.preferred_username ?? claims.email ?? '').toLowerCase()
  const user = await usersService.signIn({ entraOid: claims.oid, email, name: claims.name })
  if (!user) {
    console.warn(`Sign-in refused: ${email} is not an active portal user.`)
    await audit(req, 'auth.sign_in_refused', { actor: { email }, details: { reason: 'not_an_active_user' } })
    return res.redirect(toLoginPage('no_access', email))
  }
  await audit(req, 'auth.sign_in', { actor: user })
  await syncProfilePhoto(user.id, graphAccessToken)

  setRefreshCookie(res, issueTokens(user).refreshToken)
  res.redirect(`${env.frontendUrl}${login.returnTo}`)
})

// The user behind the refresh cookie, or null if it's missing, invalid, expired
// or revoked (account deactivated).
async function refreshCookieUser(req) {
  const token = req.cookies[REFRESH_COOKIE]
  if (!token) return null
  try {
    const payload = verifyRefreshToken(token)
    return await usersService.getSessionUser(payload.sub, payload.ver)
  } catch {
    return null
  }
}

// Exchanges the refresh cookie for a new access token. The cookie is not
// extended: a session always ends JWT_REFRESH_EXPIRES_IN after sign-in.
router.post('/refresh', refreshLimiter, async (req, res) => {
  const user = await refreshCookieUser(req)
  if (!user) {
    res.clearCookie(REFRESH_COOKIE, cookieBase)
    throw new HttpError(401, 'Not signed in')
  }
  res.json({ accessToken: signAccessToken(user), user: usersService.toPublicSessionUser(user) })
})

// Signs out this browser.
router.post('/logout', refreshLimiter, async (req, res) => {
  const user = await refreshCookieUser(req)
  if (user) await audit(req, 'auth.sign_out', { actor: user })
  res.clearCookie(REFRESH_COOKIE, cookieBase)
  res.status(204).end()
})

// A portal user's Microsoft 365 photo, for <img> tags. Images can't send the
// access token, so this checks the refresh cookie instead (its path is /api/auth):
// only signed-in portal users can see staff photos.
router.get('/photo/:id', refreshLimiter, async (req, res) => {
  if (!(await refreshCookieUser(req))) throw new HttpError(401, 'Not signed in')
  const photo = await usersRepo.findPhoto(String(req.params.id))
  if (!photo) throw new HttpError(404, 'No photo')
  // The URL changes (?v=) whenever the photo does, so it can be cached.
  res.set({ 'Content-Type': photo.type, 'Cache-Control': 'private, max-age=86400' })
  res.send(photo.data)
})

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user)
})

export default router
