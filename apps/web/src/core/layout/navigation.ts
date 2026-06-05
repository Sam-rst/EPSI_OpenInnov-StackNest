/**
 * Source de vérité de la navigation du shell applicatif.
 * Consommée par la Sidebar (items groupés) et la TopBar (titre/sous-titre par route).
 * Les routes sont des chemins littéraux alignés sur `core/router.tsx`.
 */

export type NavGroup = 'main' | 'admin'

export interface NavItem {
  id: string
  label: string
  /** Nom kebab-case d'icône lucide (résolu par le composant Icon). */
  icon: string
  group: NavGroup
  to: string
  /** Pastille optionnelle (ex. « Nouveau »). */
  badge?: string
}

export interface TopBarTitle {
  title: string
  subtitle: string
}

export const SIDEBAR_NAV: readonly NavItem[] = [
  { id: 'catalog', label: 'Catalogue', icon: 'layout-grid', group: 'main', to: '/catalog' },
  { id: 'deployments', label: 'Déploiements', icon: 'activity', group: 'main', to: '/deployments' },
  {
    id: 'chat',
    label: 'ChatOps IA',
    icon: 'sparkles',
    group: 'main',
    to: '/chat',
    badge: 'Nouveau',
  },
  { id: 'dashboard', label: 'Dashboard', icon: 'bar-chart-3', group: 'main', to: '/dashboard' },
  { id: 'team', label: 'Équipe', icon: 'users', group: 'admin', to: '/team' },
  { id: 'settings', label: 'Paramètres', icon: 'settings', group: 'admin', to: '/settings' },
]

export const TOPBAR_TITLES: Record<string, TopBarTitle> = {
  '/catalog': { title: 'Catalogue', subtitle: 'Choisis une ressource à provisionner' },
  '/deployments/config': { title: 'Configurer', subtitle: 'Paramètres et aperçu Terraform live' },
  '/deployments': { title: 'Déploiements', subtitle: 'Suivi temps réel des opérations' },
  '/chat': { title: 'ChatOps IA', subtitle: "Décris ton besoin, on s'occupe du reste" },
  '/dashboard': { title: 'Dashboard', subtitle: 'Ressources actives, coûts, KPI' },
  '/team': { title: 'Équipe', subtitle: 'Membres, rôles et permissions (RBAC)' },
  '/settings': { title: 'Paramètres', subtitle: 'Profil, sécurité, intégrations' },
}
