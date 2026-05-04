export interface HowStep {
  number: string;
  title: string;
  description: string;
  icon: string;
}

export const HOW_STEPS: ReadonlyArray<HowStep> = [
  {
    number: '01',
    title: 'Choisis dans le catalogue',
    description: 'Postgres, Redis, VM, conteneurs, LLM... 12 ressources prêtes.',
    icon: 'layout-grid',
  },
  {
    number: '02',
    title: 'Configure ou parle au chatbot',
    description: "Formulaire pas-à-pas ou langage naturel — l'IA produit le HCL.",
    icon: 'sparkles',
  },
  {
    number: '03',
    title: 'Déploie en 1 clic',
    description: 'Plan, apply, healthcheck. Logs streamés. Healthcheck inclus.',
    icon: 'rocket',
  },
];
