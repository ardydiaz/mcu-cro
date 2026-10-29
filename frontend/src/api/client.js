export const API_URL = import.meta.env.VITE_API_URL ?? '/api'

// Fired on window when the session can't be refreshed; AuthProvider signs the user out.
export const SESSION_EXPIRED = 'cro:session-expired'

export class ApiError extends Error {
  // `details`: per-field validation errors from the API, [{ field, message }]
  constructor(status, message, details = []) {
    super(message)
    this.status = status
    this.details = details
  }
}

// The access token lives only in memory; the refresh token is an httpOnly cookie.
let accessToken = null
let refreshing = null

export const setAccessToken = (token) => {
  accessToken = token
}

// Gets a new access token from the refresh cookie. Concurrent callers share one request.
export function refreshSession() {
  refreshing ??= send('/auth/refresh', { method: 'POST' })
    .then((data) => {
      setAccessToken(data.accessToken)
      return data
    })
    .catch((err) => {
      setAccessToken(null)
      throw err
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

async function send(path, { headers, ...options } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(res.status, body?.error ?? res.statusText, body?.details)
  }
  return res.status === 204 ? null : res.json()
}

export async function request(path, options) {
  try {
    return await send(path, options)
  } catch (err) {
    // Access token expired: refresh once and retry.
    if (err.status !== 401 || path.startsWith('/auth/')) throw err
    try {
      await refreshSession()
    } catch (refreshErr) {
      window.dispatchEvent(new Event(SESSION_EXPIRED))
      throw refreshErr
    }
    return send(path, options)
  }
}
