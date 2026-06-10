import { Icon } from '../../../shared/components/ui'

interface ChatEmptyStateProps {
  /** Émet une suggestion cliquée comme un message utilisateur (D2). */
  onSuggestion: (content: string) => void
}

/** Suggestion de prompt cliquable : libellé court + texte envoyé à l'assistant. */
interface PromptSuggestion {
  /** Icône lucide (kebab-case) qui illustre l'intention. */
  icon: string
  /** Libellé affiché sur la carte. */
  label: string
  /** Message envoyé tel quel à l'assistant au clic. */
  prompt: string
}

/**
 * Amorces proposées à un fil vide : couvrent les 3 intentions courantes (déployer,
 * explorer le catalogue, consulter l'existant). Cliquer envoie le `prompt` comme
 * un message utilisateur, sans rien à taper.
 */
const SUGGESTIONS: readonly PromptSuggestion[] = [
  {
    icon: 'database',
    label: 'Déploie un PostgreSQL 16',
    prompt: 'Déploie un PostgreSQL 16 isolé pour mon projet.',
  },
  {
    icon: 'layout-grid',
    label: 'Liste le catalogue',
    prompt: 'Liste le catalogue des templates disponibles.',
  },
  {
    icon: 'server',
    label: 'Mes déploiements actifs',
    prompt: 'Montre-moi mes déploiements actifs.',
  },
  {
    icon: 'sparkles',
    label: 'Propose-moi une stack',
    prompt: 'Propose-moi une stack adaptée à une API Node avec une base de données.',
  },
]

/**
 * État vide accueillant du fil + suggestions de prompts cliquables (D2). Affiché
 * quand un fil est sélectionné mais ne contient encore aucun message : on guide
 * l'utilisateur avec des amorces concrètes plutôt qu'un écran inerte.
 */
export function ChatEmptyState({ onSuggestion }: ChatEmptyStateProps) {
  return (
    <div className="flex w-full max-w-[560px] flex-col items-center gap-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="text-cyan inline-flex h-12 w-12 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)]">
          <Icon name="sparkles" size={22} />
        </span>
        <h2 className="text-text-primary text-[17px] font-semibold">Comment puis-je t'aider ?</h2>
        <p className="text-text-muted max-w-[420px] text-[13px]">
          Décris ton besoin en langage naturel, ou démarre avec une suggestion. Je te proposerai
          toujours un récap à confirmer avant d'agir.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.label}
            type="button"
            onClick={() => onSuggestion(suggestion.prompt)}
            className="border-border bg-surface hover:border-cyan text-text-secondary hover:text-text-primary flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-[12.5px] transition"
          >
            <Icon name={suggestion.icon} size={15} className="text-cyan shrink-0" />
            <span>{suggestion.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
