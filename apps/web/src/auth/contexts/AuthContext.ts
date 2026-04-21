import { createContext } from 'react'

export interface AuthContextValue {
  isAuthenticated: boolean
}

export const defaultAuthValue: AuthContextValue = { isAuthenticated: false }

export const AuthContext = createContext<AuthContextValue>(defaultAuthValue)
