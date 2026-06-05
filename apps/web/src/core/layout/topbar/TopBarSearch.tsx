import { Icon } from '../../../shared/components/ui'

/**
 * Champ de recherche global de la TopBar. Visuel pour l'instant (la recherche
 * fédérée arrivera avec un ticket dédié) ; le raccourci ⌘K est décoratif.
 */
export function TopBarSearch() {
  return (
    <div className="border-border bg-surface hidden h-9 min-w-[280px] items-center gap-2 rounded-md border px-3 lg:flex">
      <Icon name="search" size={13} className="opacity-60" />
      <input
        type="search"
        placeholder="Rechercher ressources, déploiements, users…"
        className="placeholder:text-text-muted text-text-primary flex-1 bg-transparent text-[12.5px] outline-none"
      />
      <kbd className="border-border text-text-muted inline-flex h-5 items-center rounded border px-1.5 font-mono text-[10px]">
        ⌘K
      </kbd>
    </div>
  )
}
