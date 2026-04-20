import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import type { ReactElement } from 'react'
import { AppLayout } from './layout/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { CatalogPage } from './pages/CatalogPage'
import { DeploymentsPage } from './pages/DeploymentsPage'
import { ChatPage } from './pages/ChatPage'
import { NotFoundPage } from './pages/NotFoundPage'

function protect(element: ReactElement): ReactElement {
  return <ProtectedRoute>{element}</ProtectedRoute>
}

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: protect(<DashboardPage />) },
      { path: 'catalog', element: protect(<CatalogPage />) },
      { path: 'deployments', element: protect(<DeploymentsPage />) },
      { path: 'chat', element: protect(<ChatPage />) },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]

export const router = createBrowserRouter(routes)
