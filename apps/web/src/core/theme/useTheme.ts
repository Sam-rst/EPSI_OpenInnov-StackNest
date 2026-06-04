import { useContext } from 'react'
import { ThemeContext } from './ThemeContext'

/** Accès au thème courant ; lève si utilisé hors d'un `<ThemeProvider />`. */
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme doit être utilisé dans un <ThemeProvider />')
  }
  return context
}
