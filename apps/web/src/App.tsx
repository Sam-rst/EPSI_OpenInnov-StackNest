import { RouterProvider } from 'react-router-dom'
import { EnvironmentBanner } from './core/components/EnvironmentBanner'
import { ErrorBoundary } from './core/components/ErrorBoundary'
import { router } from './core/router'

function App() {
  return (
    <ErrorBoundary>
      <EnvironmentBanner environment={import.meta.env.VITE_ENVIRONMENT} />
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}

export default App
