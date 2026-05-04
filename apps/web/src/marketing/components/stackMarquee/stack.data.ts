export interface StackItem {
  name: string;
  icon: string;
}

export const STACK_TOP: ReadonlyArray<StackItem> = [
  { name: 'Terraform',      icon: 'mountain' },
  { name: 'Docker',         icon: 'box' },
  { name: 'FastAPI',        icon: 'zap' },
  { name: 'Python 3.13',    icon: 'code-2' },
  { name: 'PostgreSQL',     icon: 'database' },
  { name: 'Redis',          icon: 'server' },
  { name: 'Nginx',          icon: 'globe' },
  { name: 'GitHub Actions', icon: 'git-branch' },
  { name: 'Sentry',         icon: 'bug' },
  { name: 'structlog',      icon: 'list' },
];

export const STACK_BOTTOM: ReadonlyArray<StackItem> = [
  { name: 'React 18',       icon: 'atom' },
  { name: 'Vite',           icon: 'zap' },
  { name: 'TypeScript',     icon: 'file-code-2' },
  { name: 'Tailwind CSS',   icon: 'palette' },
  { name: 'Framer Motion',  icon: 'sparkles' },
  { name: 'Pydantic',       icon: 'shield' },
  { name: 'SQLAlchemy',     icon: 'database' },
  { name: 'Alembic',        icon: 'history' },
  { name: 'Ollama',         icon: 'sparkles' },
  { name: 'lucide',         icon: 'feather' },
];
