import { env } from '../config/env.js'
import { HttpError } from '../utils/httpError.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

// CSRF defence in depth (on top of SameSite cookies): browsers always send
// Origin / Sec-Fetch-Site on cross-site requests, so any state-changing request
// from another site is rejected. Requests without these headers come from
// non-browser clients, which can't carry a victim's cookies anyway.
export default function checkOrigin(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next()

  const origin = req.get('origin')
  if (origin && origin !== env.frontendUrl) {
    return next(new HttpError(403, 'Request blocked: unexpected origin'))
  }
  if (req.get('sec-fetch-site') === 'cross-site') {
    return next(new HttpError(403, 'Request blocked: cross-site request'))
  }
  next()
}
