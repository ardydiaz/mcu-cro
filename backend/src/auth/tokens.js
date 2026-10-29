import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

const { accessSecret, refreshSecret, accessExpiresIn, refreshExpiresIn, issuer } = env.jwt

// `user` must have: id, email, roles (string[])
export function signAccessToken(user) {
  return jwt.sign({ email: user.email, roles: user.roles, type: 'access' }, accessSecret, {
    subject: String(user.id),
    expiresIn: accessExpiresIn,
    issuer,
  })
}

export function signRefreshToken(user) {
  return jwt.sign({ type: 'refresh' }, refreshSecret, {
    subject: String(user.id),
    expiresIn: refreshExpiresIn,
    issuer,
  })
}

export function issueTokens(user) {
  return { accessToken: signAccessToken(user), refreshToken: signRefreshToken(user) }
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, accessSecret, { issuer, algorithms: ['HS256'] })
  if (payload.type !== 'access') throw new jwt.JsonWebTokenError('invalid token type')
  return payload
}

export function verifyRefreshToken(token) {
  const payload = jwt.verify(token, refreshSecret, { issuer, algorithms: ['HS256'] })
  if (payload.type !== 'refresh') throw new jwt.JsonWebTokenError('invalid token type')
  return payload
}
