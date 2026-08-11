import {
  getUser,
  logout as netlifyLogout,
  onAuthChange,
  type User,
} from '@netlify/identity'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type IdentityContextValue = {
  user: User | null
  ready: boolean
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const IdentityContext = createContext<IdentityContextValue | null>(null)

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  const refresh = async () => {
    const currentUser = await getUser()
    setUser(currentUser ?? null)
    setReady(true)
  }

  useEffect(() => {
    void refresh()
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser ?? null)
      setReady(true)
    })
    return unsubscribe
  }, [])

  return (
    <IdentityContext.Provider value={{ user, ready, logout: netlifyLogout, refresh }}>
      {children}
    </IdentityContext.Provider>
  )
}

export function useIdentity() {
  const context = useContext(IdentityContext)
  if (!context) throw new Error('useIdentity must be used within IdentityProvider')
  return context
}
