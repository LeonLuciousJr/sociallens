import { useCallback, useState } from 'react'
import { AuthContext } from './AuthContext.js'

export default function AuthProvider({ children }) {
  // Memory only: no passwords/tokens in localStorage, sessionStorage, or URLs.
  // No refresh/revocation endpoint is specified. Reload starts signed out.
  const [session, setSession] = useState(null)
  const signOut = useCallback(() => setSession(null), [])
  return (
    <AuthContext.Provider value={{ session, signIn: setSession, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
