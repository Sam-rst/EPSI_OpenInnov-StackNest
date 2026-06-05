import { createContext } from 'react'

export interface AuthContextValue {
  isAuthenticated: boolean
}

export const defaultAuthValue: AuthContextValue = { isAuthenticated: true }

export const AuthContext = createContext<AuthContextValue>(defaultAuthValue)
