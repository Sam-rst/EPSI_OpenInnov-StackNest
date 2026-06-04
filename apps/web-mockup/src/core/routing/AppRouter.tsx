import { lazy, Suspense, type ReactElement } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppShell } from '@core/layout/AppShell';
import { ROUTES } from './routes';

const LandingPage = lazy(() =>
  import('@marketing/pages/LandingPage').then((m) => ({ default: m.LandingPage })),
);
const LoginPage = lazy(() =>
  import('@auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const CatalogPage = lazy(() =>
  import('@catalog/pages/CatalogPage').then((m) => ({ default: m.CatalogPage })),
);
const ConfigPage = lazy(() =>
  import('@deployment/pages/ConfigPage').then((m) => ({ default: m.ConfigPage })),
);
const DeploymentPage = lazy(() =>
  import('@deployment/pages/DeploymentPage').then((m) => ({ default: m.DeploymentPage })),
);
const DashboardPage = lazy(() =>
  import('@dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const ChatPage = lazy(() =>
  import('@chat/pages/ChatPage').then((m) => ({ default: m.ChatPage })),
);
const AdminPage = lazy(() =>
  import('@admin/pages/AdminPage').then((m) => ({ default: m.AdminPage })),
);
const SettingsPage = lazy(() =>
  import('@settings/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);

const PageFallback = (): ReactElement => (
  <div className="flex items-center justify-center min-h-[40vh] text-text-muted">Chargement…</div>
);

export function AppRouter() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path={ROUTES.public.landing} element={<LandingPage />} />
        <Route path={ROUTES.public.login} element={<LoginPage />} />

        <Route element={<AppShell />}>
          <Route path={ROUTES.app.catalog} element={<CatalogPage />} />
          <Route path={ROUTES.app.config} element={<ConfigPage />} />
          <Route path={ROUTES.app.deploy} element={<DeploymentPage />} />
          <Route path={ROUTES.app.dashboard} element={<DashboardPage />} />
          <Route path={ROUTES.app.chat} element={<ChatPage />} />
          <Route path={ROUTES.app.admin} element={<AdminPage />} />
          <Route path={ROUTES.app.settings} element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<div className="p-12 text-center">404</div>} />
      </Routes>
    </Suspense>
  );
}
