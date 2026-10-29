import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

const { accessSecret, refreshSecret, accessExpiresIn, refreshExpiresIn, issuer } = env.jwt

// `ver` is the user's token_version when the token was issued; bumping it in the
// database revokes the token. Roles are not trusted from the token: requireAuth
// re-reads the user on every request.
const claimsOf = (user) => ({ email: user.email, name: user.name, ver: user.tokenVersion })

// `user` must have: id, email, name, tokenVersion
export function signAccessToken(user) {
  return jwt.sign({ ...claimsOf(user), type: 'access' }, accessSecret, {
    subject: String(user.id),
    expiresIn: accessExpiresIn,
    issuer,
  })
}

// Carries only the user id and token version; /auth/refresh reloads the user.
export function signRefreshToken(user) {
  return jwt.sign({ ver: user.tokenVersion, type: 'refresh' }, refreshSecret, {
    subject: String(user.id),
    expiresIn: refreshExpiresIn,
    issuer,
  })
}

export function issueTokens(user) {
  return { accessToken: signAccessToken(user), refreshToken: signRefreshToken(user) }
}

function verify(token, secret, type) {
  const payload = jwt.verify(token, secret, { issuer, algorithms: ['HS256'] })
  if (payload.type !== type) throw new jwt.JsonWebTokenError('invalid token type')
  return payload
}

export const verifyAccessToken = (token) => verify(token, accessSecret, 'access')
export const verifyRefreshToken = (token) => verify(token, refreshSecret, 'refresh')

// Short-lived token that carries the OAuth state + PKCE verifier across the
// redirect to Microsoft and back.
export function signLoginState(data) {
  return jwt.sign({ ...data, type: 'm365-login' }, accessSecret, { expiresIn: '10m', issuer })
}

export const verifyLoginState = (token) => verify(token, accessSecret, 'm365-login')
