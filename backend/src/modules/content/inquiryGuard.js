// Spam checks for the website's contact form, all done here without outside
// services. Bots are answered as if their message was sent, so they learn nothing.
import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '../../config/env.js'
import { HttpError } from '../../utils/httpError.js'
import * as inquiries from './inquiries.repository.js'

const MIN_FILL_MS = 3000 // people need more than 3 seconds to fill in the form
const MAX_AGE_MS = 24 * 3600 * 1000
const MAX_LINKS = 2

// Separate key derived from the JWT secret, so form tokens can't be used as sign-in tokens.
const key = createHmac('sha256', env.jwt.accessSecret).update('contact-form-token').digest()
const sign = (time) => createHmac('sha256', key).update(String(time)).digest('base64url')

// Issued when the form is shown: "<time>.<signature>".
export const issueFormToken = () => {
  const time = Date.now()
  return `${time}.${sign(time)}`
}

// 'ok' | 'invalid' (missing, forged, or sent too fast) | 'expired' (form open too long)
function checkFormToken(token) {
  const [time, signature] = String(token ?? '').split('.')
  const expected = sign(time)
  if (!time || !signature || signature.length !== expected.length) return 'invalid'
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return 'invalid'
  const age = Date.now() - Number(time)
  if (age < MIN_FILL_MS) return 'invalid'
  return age > MAX_AGE_MS ? 'expired' : 'ok'
}

const countLinks = (...texts) => texts.join(' ').match(/https?:\/\/|www\.|\[url|<a\s/gi)?.length ?? 0

// Returns 'accept' or 'drop' (answer as sent, but don't save). Throws for
// problems a real person should fix.
export async function screen(body) {
  if (body.website) return 'drop' // hidden trap field filled in

  const token = checkFormToken(body.formToken)
  if (token === 'expired') {
    throw new HttpError(400, 'This form was open for a long time. Please send your message again.', [
      { field: 'formToken', message: 'expired' },
    ])
  }
  if (token === 'invalid') return 'drop'

  if (countLinks(body.message, body.name, body.organization ?? '') > MAX_LINKS) {
    throw new HttpError(400, 'Please check the highlighted fields.', [
      { field: 'message', message: `Please include no more than ${MAX_LINKS} links.` },
    ])
  }
  if (await inquiries.isBlocked(body.email)) return 'drop'
  if (await inquiries.isRecentDuplicate(body.email, body.message)) return 'drop'
  return 'accept'
}
