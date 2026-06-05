export interface MockupResource {
  name: string
  desc: string
  icon: string
  tag: string
}

export const MOCKUP_RESOURCES: ReadonlyArray<MockupResource> = [
  { name: 'PostgreSQL 16', desc: 'Base relationnelle managée', icon: 'database', tag: 'SQL' },
  { name: 'Redis 7', desc: 'Cache in-memory', icon: 'server', tag: 'Cache' },
  { name: 'VM Ubuntu 24.04', desc: 'Machine virtuelle Ubuntu LTS', icon: 'monitor', tag: 'Compute' },
  { name: 'Conteneur Node.js', desc: 'Image Node 22 LTS', icon: 'box', tag: 'Runtime' },
  { name: 'Stack ELK', desc: 'Logs + search + viz', icon: 'bar-chart-3', tag: 'Obs' },
  { name: 'Ollama', desc: 'Serveur de modèles LLM', icon: 'sparkles', tag: 'AI' },
]

export interface MockupNavItem {
  icon: string
  label: string
  active?: boolean
}

export const MOCKUP_NAV: ReadonlyArray<MockupNavItem> = [
  { icon: 'layout-grid', label: 'Catalogue', active: true },
  { icon: 'layers', label: 'Mes ressources' },
  { icon: 'activity', label: 'Déploiements' },
  { icon: 'sparkles', label: 'ChatOps' },
  { icon: 'bar-chart-3', label: 'Dashboard' },
  { icon: 'users', label: 'Équipe' },
  { icon: 'settings', label: 'Paramètres' },
]
