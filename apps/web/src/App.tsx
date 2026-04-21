import { RouterProvider } from 'react-router-dom'
import { EnvironmentBanner } from './core/components/EnvironmentBanner'
import { ErrorBoundary } from './core/components/ErrorBoundary'
import { AuthProvider } from './auth/providers/AuthProvider'
import { router } from './core/router'

function App() {
  return (
    <ErrorBoundary>
      <EnvironmentBanner environment={import.meta.env.VITE_ENVIRONMENT} />
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
