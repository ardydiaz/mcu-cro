import { rateLimit, ipKeyGenerator } from 'express-rate-limit'

const FIFTEEN_MINUTES = 15 * 60 * 1000

const limiter = (limit, message, options = {}) =>
  rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: message },
    ...options,
  })

// Starting Microsoft 365 sign-in and its callback. Per IP, generous enough for
// a campus where many staff share one public address.
export const signInLimiter = limiter(100, 'Too many sign-in attempts. Please wait a few minutes and try again.')

// Token refresh: runs on page load and roughly every 15 minutes per open tab.
export const refreshLimiter = limiter(300, 'Too many requests. Please wait a few minutes and try again.')

// Public website API (no sign-in), per visitor IP.
export const publicLimiter = limiter(900, 'Too many requests. Please wait a few minutes and try again.')

// Contact form: a handful of messages per IP per hour stops floods and spam.
export const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'You have sent several messages already. Please try again in an hour, or email us directly.' },
})

// Everything else under /api, after requireAuth: counted per signed-in user.
export const apiLimiter = limiter(1500, 'Too many requests. Please slow down and try again shortly.', {
  keyGenerator: (req) => (req.user ? `user:${req.user.id}` : ipKeyGenerator(req.ip)),
})
