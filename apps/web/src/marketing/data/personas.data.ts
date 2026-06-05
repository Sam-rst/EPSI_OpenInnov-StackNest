export type PersonaAccent = 'cyan' | 'yellow'
export type PersonaMockupKey = 'student' | 'senior' | 'lead'

export interface PersonaBullet {
  icon: string
  text: string
}

export interface Persona {
  tag: string
  icon: string
  accent: PersonaAccent
  name: string
  headline: string
  story: string
  bullets: ReadonlyArray<PersonaBullet>
  mockup: PersonaMockupKey
}

/**
 * Personas illustratifs (CA5) — usages représentatifs, pas des clients réels.
 * Aucune métrique sociale chiffrée ni témoignage nominatif.
 */
export const PERSONAS: ReadonlyArray<Persona> = [
  {
    tag: 'Persona 01',
    icon: 'graduation-cap',
    accent: 'cyan',
    name: 'Étudiants',
    headline: 'Du code, pas de Terraform.',
    story:
      "Tu apprends Node, pas l'infra. StackNest te donne une BDD prête en quelques secondes — tu lances ton projet, tu oublies l'ops.",
    bullets: [
      { icon: 'zap', text: 'BDD provisionnée en quelques secondes' },
      { icon: 'rocket', text: 'Aucune ligne de HCL à écrire' },
      { icon: 'book-open', text: 'Idéal pour TDs, projets de cours, hackathons' },
    ],
    mockup: 'student',
  },
  {
    tag: 'Persona 02',
    icon: 'code-2',
    accent: 'yellow',
    name: 'Devs senior',
    headline: 'Sandbox isolé, BDD répliquée.',
    story:
      'Ton équipe partage un dev. Tu provisionnes ton propre env miroir en un clic — tu testes des migrations sans casser le travail des autres.',
    bullets: [
      { icon: 'shield', text: 'Sandbox totalement isolé du dev partagé' },
      { icon: 'copy', text: 'BDD répliquée depuis prod, anonymisée' },
      { icon: 'trash-2', text: 'Détruit en 1 clic après usage' },
    ],
    mockup: 'senior',
  },
  {
    tag: 'Persona 03',
    icon: 'briefcase',
    accent: 'cyan',
    name: 'Lead devs PME',
    headline: 'Self-hosted, à coût maîtrisé.',
    story:
      'Pas de cloud surfacturé. Tu déploies sur ton serveur Proxmox, tu vois les coûts en temps réel, tu gardes la main sur tes données.',
    bullets: [
      { icon: 'server', text: 'Tourne sur ton infra Proxmox / Docker' },
      { icon: 'wallet', text: 'Coûts visibles, alertes paramétrables' },
      { icon: 'users', text: 'RBAC granulaire pour ton équipe' },
    ],
    mockup: 'lead',
  },
]

export const PERSONA_AUTOPLAY_MS = 7000
