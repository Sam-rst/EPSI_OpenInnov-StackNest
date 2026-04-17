import { createBrowserRouter } from 'react-router-dom'
import { HomePage } from './components/HomePage'
import { Layout } from './components/Layout'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [{ index: true, element: <HomePage /> }],
  },
])
