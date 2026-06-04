import { ROUTES } from '@core/routing/routes';

export type NavGroup = 'main' | 'admin';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  group: NavGroup;
  to: string;
  badge?: string;
}

export const SIDEBAR_NAV: ReadonlyArray<NavItem> = [
  { id: 'catalog',   label: 'Catalogue',    icon: 'layout-grid',  group: 'main',  to: ROUTES.app.catalog },
  { id: 'deploy',    label: 'Déploiements', icon: 'activity',     group: 'main',  to: ROUTES.app.deploy },
  { id: 'chat',      label: 'ChatOps IA',   icon: 'sparkles',     group: 'main',  to: ROUTES.app.chat, badge: 'Nouveau' },
  { id: 'dashboard', label: 'Dashboard',    icon: 'bar-chart-3',  group: 'main',  to: ROUTES.app.dashboard },
  { id: 'users',     label: 'Équipe',       icon: 'users',        group: 'admin', to: ROUTES.app.admin },
  { id: 'settings',  label: 'Paramètres',   icon: 'settings',     group: 'admin', to: ROUTES.app.settings },
];

export const TOPBAR_TITLES: Record<string, { t: string; s: string }> = {
  [ROUTES.app.catalog]:   { t: 'Catalogue',     s: 'Choisis une ressource à provisionner' },
  [ROUTES.app.config]:    { t: 'Configurer',    s: 'Paramètres et aperçu Terraform live' },
  [ROUTES.app.deploy]:    { t: 'Déploiements',  s: 'Suivi temps réel des opérations' },
  [ROUTES.app.chat]:      { t: 'ChatOps IA',    s: "Décris ton besoin, on s'occupe du reste" },
  [ROUTES.app.dashboard]: { t: 'Dashboard',     s: 'Ressources actives, coûts, KPI' },
  [ROUTES.app.admin]:     { t: 'Équipe',        s: 'Membres, rôles et permissions (RBAC)' },
  [ROUTES.app.settings]:  { t: 'Paramètres',    s: 'Profil, sécurité, intégrations' },
};
