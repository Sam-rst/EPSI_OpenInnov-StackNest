import type { ReactNode } from 'react'
import { AuthContext, defaultAuthValue, type AuthContextValue } from './AuthContext'

interface AuthProviderProps {
  value?: AuthContextValue
  children: ReactNode
}

export function AuthProvider({ value = defaultAuthValue, children }: AuthProviderProps) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
