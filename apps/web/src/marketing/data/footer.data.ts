export interface FooterColumn {
  title: string
  links: readonly string[]
}

export const FOOTER_COLUMNS: readonly FooterColumn[] = [
  { title: 'Produit', links: ['Catalogue', 'ChatOps', 'Déploiement', 'Roadmap'] },
  { title: 'Ressources', links: ['Documentation', 'Guides', 'API', 'Changelog'] },
  { title: 'Légal', links: ['Mentions', 'Confidentialité', 'CGU', 'Sécurité'] },
]
