import { useContext } from 'react'
import { AuthContext } from './authContext.js'

export default function useCurrentUser() {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useCurrentUser must be used inside <AuthProvider>')
  const hasRole = (...roles) => Boolean(auth.user?.roles.some((role) => roles.includes(role)))
  return { ...auth, hasRole }
}
