export type FeatureKind = 'catalog' | 'chat' | 'tf' | 'logs';

export interface Feature {
  title: string;
  description: string;
  kind: FeatureKind;
}

export const FEATURES: ReadonlyArray<Feature> = [
  {
    title: 'Catalogue de ressources',
    description: '12 ressources prêtes à déployer, du Postgres au Vault, du LLM local au reverse proxy.',
    kind: 'catalog',
  },
  {
    title: 'ChatOps IA',
    description: "Décris ton besoin en français, l'IA produit le HCL et lance le déploiement.",
    kind: 'chat',
  },
  {
    title: 'Plan Terraform live',
    description: "L'aperçu HCL se met à jour à chaque champ. Diff coloré avant apply.",
    kind: 'tf',
  },
  {
    title: 'Suivi en temps réel',
    description: 'Stepper de déploiement et logs streamés, healthcheck inclus.',
    kind: 'logs',
  },
];
