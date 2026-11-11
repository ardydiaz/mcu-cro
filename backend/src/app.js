import express from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { env } from './config/env.js'
import authRoutes from './auth/auth.routes.js'
import publicRoutes from './routes/public.routes.js'
import adminRoutes from './routes/admin.routes.js'
import requireAuth from './middleware/requireAuth.js'
import checkOrigin from './middleware/checkOrigin.js'
import { apiLimiter, publicLimiter } from './middleware/rateLimit.js'
import errorHandler from './middleware/errorHandler.js'

const app = express()

app.set('trust proxy', env.trustProxy)

// Security headers (strict CSP, no framing, no MIME sniffing, HSTS, no X-Powered-By…).
// The API only returns JSON, files and redirects, so the CSP can block everything.
app.use(
  helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
    // Uploaded images are shown on the website (same site, through the /api proxy).
    crossOriginResourcePolicy: { policy: 'same-site' },
  }),
)

app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())
app.use('/api', checkOrigin)

// Unauthenticated: health check and sign-in / token endpoints (rate-limited in authRoutes).
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api/auth', authRoutes)

// Unauthenticated: the public Community Website. Read-only and published content
// only (plus the rate-limited contact form); never beneficiary records.
app.use('/api/public', publicLimiter, publicRoutes)

// Everything below requires a valid, unrevoked access token for an active user.
app.use('/api', requireAuth, apiLimiter)
app.use('/api/admin', adminRoutes)

app.use((req, res) => res.status(404).json({ error: 'Not Found' }))
app.use(errorHandler)

export default app
