import { RouterProvider } from 'react-router-dom'
import { AppProviders } from './core/AppProviders'
import { router } from './core/router'

function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}

export default App
