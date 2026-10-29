function required(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

// JWT secrets must be long and random (generate with `npm run secret`).
function secret(name) {
  const value = required(name)
  if (value.length < 32) throw new Error(`${name} is too short: use at least 32 random characters (npm run secret)`)
  return value
}

const isProduction = process.env.NODE_ENV === 'production'
const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:2001').replace(/\/$/, '')

export const env = {
  isProduction,
  port: Number(process.env.PORT ?? 2002),
  frontendUrl,
  // Number of reverse proxies in front of the API (e.g. 1 behind nginx/IIS or
  // Cloudflare → server). Needed so rate limits and audit logs see the real
  // client IP. Keep 0 when the API is reached directly.
  trustProxy: Number(process.env.TRUST_PROXY ?? 0),
  jwt: {
    accessSecret: secret('JWT_ACCESS_SECRET'),
    refreshSecret: secret('JWT_REFRESH_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '8h',
    issuer: process.env.JWT_ISSUER ?? 'mcu-cro-api',
  },
  // Microsoft 365 / Entra ID app registration. Optional so the API can start
  // before the app is registered; sign-in reports "not configured" until then.
  m365: {
    tenantId: process.env.M365_TENANT_ID ?? '',
    clientId: process.env.M365_CLIENT_ID ?? '',
    clientSecret: process.env.M365_CLIENT_SECRET ?? '',
    redirectUri: process.env.M365_REDIRECT_URI ?? `${frontendUrl}/api/auth/m365/callback`,
  },
}

export const m365Configured = Boolean(env.m365.tenantId && env.m365.clientId && env.m365.clientSecret)
