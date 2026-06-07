import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import type { ReactElement } from 'react'
import { AppLayout } from './layout/AppLayout'
import { NotFoundPage } from '../shared/pages/NotFoundPage'
import { ProtectedRoute } from '../auth/components/ProtectedRoute'
import { LoginPage } from '../auth/pages/LoginPage'
import { RegisterPage } from '../auth/pages/RegisterPage'
import { ForgotPasswordPage } from '../auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '../auth/pages/ResetPasswordPage'
import { VerifyEmailPage } from '../auth/pages/VerifyEmailPage'
import { LandingPage } from '../marketing/pages'
import { DashboardPage } from '../dashboard/pages/DashboardPage'
import { CatalogPage } from '../catalog/pages/CatalogPage'
import { CatalogDetailPage } from '../catalog/pages/CatalogDetailPage'
import { CatalogAdminPage } from '../catalog/pages/CatalogAdminPage'
import { DeploymentsPage } from '../deployment/pages/DeploymentsPage'
import { DeploymentDetailPage } from '../deployment/pages/DeploymentDetailPage'
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
  // Routes d'authentification publiques (placeholder, livrées par le track auth).
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot', element: <ForgotPasswordPage /> },
  { path: '/reset', element: <ResetPasswordPage /> },
  { path: '/verify', element: <VerifyEmailPage /> },
  // Routes applicatives : layout sans chemin (pathless), enfants en chemins absolus.
  {
    element: <AppLayout />,
    children: [
      { path: 'dashboard', element: requireAuth(<DashboardPage />) },
      { path: 'catalog', element: requireAuth(<CatalogPage />) },
      // Écran d'admin du catalogue (gardé `RequireAdmin` côté page). Déclaré avant
      // `catalog/:id` : le segment statique « admin » prime sur le param dynamique.
      { path: 'catalog/admin', element: requireAuth(<CatalogAdminPage />) },
      { path: 'catalog/:id', element: requireAuth(<CatalogDetailPage />) },
      { path: 'deployments', element: requireAuth(<DeploymentsPage />) },
      { path: 'deployments/:id', element: requireAuth(<DeploymentDetailPage />) },
      { path: 'deployments/config', element: requireAuth(<ConfigPage />) },
      { path: 'chat', element: requireAuth(<ChatPage />) },
      { path: 'team', element: requireAuth(<TeamPage />) },
      { path: 'settings', element: requireAuth(<SettingsPage />) },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]

export const router = createBrowserRouter(routes)
