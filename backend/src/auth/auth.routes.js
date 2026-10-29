import { Router } from 'express'
import { issueTokens, verifyRefreshToken } from './tokens.js'
import requireAuth from '../middleware/requireAuth.js'
import { HttpError } from '../utils/httpError.js'

const router = Router()

// TODO: POST /login — verify the user (Microsoft 365 / database), then
// respond with issueTokens({ id, email, roles }).

router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body ?? {}
  if (!refreshToken) throw new HttpError(400, 'refreshToken is required')

  let payload
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    throw new HttpError(401, 'Invalid or expired refresh token')
  }

  // TODO: load the user by payload.sub from the database (current email and
  // roles) and reject disabled users. Until then a refresh cannot be completed.
  throw new HttpError(501, `User lookup not implemented (user ${payload.sub})`)
})

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user)
})

export default router
