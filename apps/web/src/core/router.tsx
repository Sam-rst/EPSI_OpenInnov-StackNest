import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import type { ReactElement } from 'react'
import { AppLayout } from './layout/AppLayout'
import { NotFoundPage } from '../shared/pages/NotFoundPage'
import { ProtectedRoute } from '../auth/components/ProtectedRoute'
import { LoginPage } from '../auth/pages/LoginPage'
import { DashboardPage } from '../dashboard/pages/DashboardPage'
import { CatalogPage } from '../catalog/pages/CatalogPage'
import { DeploymentsPage } from '../deployment/pages/DeploymentsPage'
import { ChatPage } from '../chat/pages/ChatPage'

function requireAuth(element: ReactElement): ReactElement {
  return <ProtectedRoute>{element}</ProtectedRoute>
}

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: requireAuth(<DashboardPage />) },
      { path: 'catalog', element: requireAuth(<CatalogPage />) },
      { path: 'deployments', element: requireAuth(<DeploymentsPage />) },
      { path: 'chat', element: requireAuth(<ChatPage />) },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]

export const router = createBrowserRouter(routes)
