import { useCallback, useEffect, useMemo, useState } from 'react'
import { API_URL, refreshSession, request, SESSION_EXPIRED, setAccessToken } from '../api/client.js'
import { AuthContext } from './authContext.js'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading') // loading | authenticated | anonymous

  // Restore the session from the refresh cookie on first load.
  useEffect(() => {
    refreshSession()
      .then((data) => {
        setUser(data.user)
        setStatus('authenticated')
      })
      .catch(() => setStatus('anonymous'))

    const onExpired = () => {
      setUser(null)
      setStatus('anonymous')
    }
    window.addEventListener(SESSION_EXPIRED, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED, onExpired)
  }, [])

  // Full-page redirect: the backend sends the browser on to Microsoft 365.
  const signIn = useCallback((returnTo = '/admin') => {
    window.location.assign(`${API_URL}/auth/m365/login?returnTo=${encodeURIComponent(returnTo)}`)
  }, [])

  // everywhere = true also signs out every other browser and device.
  const signOut = useCallback(async ({ everywhere = false } = {}) => {
    await request(everywhere ? '/auth/logout-all' : '/auth/logout', { method: 'POST' }).catch(() => {})
    setAccessToken(null)
    setUser(null)
    setStatus('anonymous')
  }, [])

  const value = useMemo(() => ({ user, status, signIn, signOut }), [user, status, signIn, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
