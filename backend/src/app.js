import express from 'express'
import authRoutes from './auth/auth.routes.js'
import publicRoutes from './routes/public.routes.js'
import adminRoutes from './routes/admin.routes.js'
import requireAuth from './middleware/requireAuth.js'
import errorHandler from './middleware/errorHandler.js'

const app = express()

app.use(express.json())

// Unauthenticated: health check and token endpoints.
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api/auth', authRoutes)

// Everything below requires a valid access token.
app.use('/api', requireAuth)
app.use('/api/public', publicRoutes)
app.use('/api/admin', adminRoutes)

app.use((req, res) => res.status(404).json({ error: 'Not Found' }))
app.use(errorHandler)

export default app
