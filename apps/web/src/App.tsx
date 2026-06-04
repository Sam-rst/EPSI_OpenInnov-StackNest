import { RouterProvider } from 'react-router-dom'
import { EnvironmentBanner } from './core/components/EnvironmentBanner'
import { ErrorBoundary } from './core/components/ErrorBoundary'
import { ThemeProvider } from './core/theme/ThemeProvider'
import { AuthProvider } from './auth/providers/AuthProvider'
import { router } from './core/router'

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <EnvironmentBanner environment={import.meta.env.VITE_ENVIRONMENT} />
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
