import { createBrowserRouter } from 'react-router-dom'
import { HomePage } from './components/HomePage'
import { AppLayout } from './layout/AppLayout'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [{ index: true, element: <HomePage /> }],
  },
])
