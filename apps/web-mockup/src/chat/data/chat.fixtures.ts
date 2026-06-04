import type { Message } from '../domain/models/Message';

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
export type MessagePart = DistributiveOmit<Message, 'role'>;

export const SEED_MESSAGES: ReadonlyArray<Message> = [
  {
    role: 'assistant',
    kind: 'text',
    text:
      'Bonjour Yassine 👋  Décris-moi ton besoin en français : type de ressource, taille, environnement, options. Je m\'occupe du HCL et du déploiement.',
  },
];

export interface ScriptedAnswer {
  trigger: string;
  parts: ReadonlyArray<MessagePart>;
}

export const SCRIPTED_ANSWERS: ReadonlyArray<ScriptedAnswer> = [
  {
    trigger: 'je veux un environn',
    parts: [
      { kind: 'text', text: 'Compris. Voici ce que je propose pour un sandbox isolé :' },
      {
        kind: 'plan',
        items: [
          { icon: 'database', name: 'PostgreSQL 16.4', spec: 'small · 1 vCPU · 2 GB · 20 GB SSD' },
          { icon: 'server',   name: 'Redis 7',         spec: 'small · 256 MB' },
          { icon: 'network',  name: 'Réseau privé',    spec: 'sandbox-yassine.local · isolé' },
        ],
        cost: 16,
        time: '~ 35 s',
      },
      {
        kind: 'text',
        text:
          'On part sur l\'environnement <span class="font-mono text-cyan">dev</span>, accès limité à Yassine. Tu valides ?',
      },
    ],
  },
];

export interface Conversation {
  id: string;
  title: string;
  when: string;
}

export const CONVERSATIONS: ReadonlyArray<Conversation> = [
  { id: 'c1', title: 'Env de dev Node + Postgres', when: "à l'instant" },
  { id: 'c2', title: 'Cluster Redis avec replica', when: 'il y a 2 h' },
  { id: 'c3', title: 'Bucket S3 pour backups',     when: 'hier' },
  { id: 'c4', title: 'Stack monitoring complète',  when: 'il y a 3 j' },
  { id: 'c5', title: 'GPU pour Ollama mistral',    when: 'il y a 5 j' },
];

export const SUGGESTIONS: ReadonlyArray<string> = [
  'Postgres + Redis isolé pour Yassine',
  'Stack monitoring (ELK + Grafana)',
  'Bucket S3 versionné pour backups',
  'GPU pour Ollama mistral 7b',
];
