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

  const signOut = useCallback(async () => {
    await request('/auth/logout', { method: 'POST' }).catch(() => {})
    setAccessToken(null)
    setUser(null)
    setStatus('anonymous')
  }, [])

  // Re-reads the signed-in user from the server (e.g. after changing your own role).
  const reloadUser = useCallback(async () => {
    const data = await refreshSession()
    setUser(data.user)
  }, [])

  const value = useMemo(
    () => ({ user, status, signIn, signOut, reloadUser }),
    [user, status, signIn, signOut, reloadUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
