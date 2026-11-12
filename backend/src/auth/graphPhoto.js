import * as usersRepo from '../modules/users/users.repository.js'

// The person's Microsoft 365 profile photo, from Microsoft Graph (needs the
// delegated User.Read permission). 120x120 is the smallest size Graph returns
// for every account, and is plenty for the avatars in the portal.
const PHOTO_URL = 'https://graph.microsoft.com/v1.0/me/photos/120x120/$value'
const MAX_BYTES = 200 * 1024
const TYPES = new Set(['image/jpeg', 'image/png'])

// Copies the photo into the users table. Never blocks or fails a sign-in: on
// any error the stored photo is left as it was.
export async function syncProfilePhoto(userId, graphAccessToken) {
  if (!graphAccessToken) return
  try {
    const res = await fetch(PHOTO_URL, {
      headers: { Authorization: `Bearer ${graphAccessToken}` },
      signal: AbortSignal.timeout(5000),
    })
    // 404: the person has no photo (or no mailbox); remove the old one.
    if (res.status === 404) return await usersRepo.setPhoto(userId, null, null)
    if (!res.ok) return console.warn(`Microsoft 365 photo not loaded (HTTP ${res.status}).`)

    const type = (res.headers.get('content-type') ?? '').split(';')[0].trim()
    const data = Buffer.from(await res.arrayBuffer())
    if (!TYPES.has(type) || data.length === 0 || data.length > MAX_BYTES) return
    await usersRepo.setPhoto(userId, data, type)
  } catch (err) {
    console.warn('Microsoft 365 photo not loaded:', err.message)
  }
}
