import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import type { ReactElement } from 'react'
import { AppLayout } from './layout/AppLayout'
import { NotFoundPage } from '../shared/pages/NotFoundPage'
import { ProtectedRoute } from '../auth/components/ProtectedRoute'
import { LoginPage } from '../auth/pages/LoginPage'
import { LandingPage } from '../marketing/pages'
import { DashboardPage } from '../dashboard/pages/DashboardPage'
import { CatalogPage } from '../catalog/pages/CatalogPage'
import { DeploymentsPage } from '../deployment/pages/DeploymentsPage'
import { ConfigPage } from '../deployment/pages/ConfigPage'
import { ChatPage } from '../chat/pages/ChatPage'
import { TeamPage } from '../team/pages/TeamPage'
import { SettingsPage } from '../settings/pages/SettingsPage'

function requireAuth(element: ReactElement): ReactElement {
  return <ProtectedRoute>{element}</ProtectedRoute>
}

export const routes: RouteObject[] = [
  // Landing marketing publique (display-only) : / ne redirige plus vers /dashboard.
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  // Routes applicatives : layout sans chemin (pathless), enfants en chemins absolus.
  {
    element: <AppLayout />,
    children: [
      { path: 'dashboard', element: requireAuth(<DashboardPage />) },
      { path: 'catalog', element: requireAuth(<CatalogPage />) },
      { path: 'deployments', element: requireAuth(<DeploymentsPage />) },
      { path: 'deployments/config', element: requireAuth(<ConfigPage />) },
      { path: 'chat', element: requireAuth(<ChatPage />) },
      { path: 'team', element: requireAuth(<TeamPage />) },
      { path: 'settings', element: requireAuth(<SettingsPage />) },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]

export const router = createBrowserRouter(routes)
