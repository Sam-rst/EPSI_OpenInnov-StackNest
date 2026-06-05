import { Button, Icon } from './ui'

interface EmptyStateProps {
  /** Nom d'icône lucide en kebab-case (ex. « inbox », « activity »). */
  icon: string
  /** Titre principal de l'état vide (phrase honnête, ex. « Aucune ressource déployée »). */
  title: string
  /** Description d'accompagnement orientant l'action suivante. */
  description: string
  /** Libellé du bouton d'appel à l'action (optionnel). */
  actionLabel?: string
  /** Callback déclenché au clic sur le CTA (requis avec `actionLabel`). */
  onAction?: () => void
}

/**
 * État vide honnête réutilisable : icône décorative, titre, description et CTA
 * optionnel. Sert à matérialiser l'absence de données sans inventer de contenu
 * (dashboard sans backend, listes vides…). Tous les tons suivent la charte
 * (clair/sombre) via les tokens sémantiques.
 */
export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="border-border text-text-muted flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-14 text-center">
      <span className="text-cyan flex h-12 w-12 items-center justify-center rounded-xl bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)]">
        <Icon name={icon} size={22} />
      </span>
      <div className="text-text-secondary mt-4 text-[14px] font-semibold">{title}</div>
      <p className="mt-1 max-w-sm text-[12.5px] leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" icon="arrow-right" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
