import { Icon } from '../../../shared/components/ui'

interface WorkspaceSwitcherProps {
  /** Nom de l'espace de travail (ex. « StackNest »). */
  name: string
  /** Plan affiché (ex. « local »). */
  plan: string
  /** Initiales de la pastille (ex. « SN »). */
  initials: string
}

/**
 * Sélecteur d'espace de travail (visuel pour l'instant — le multi-workspace
 * arrivera avec un ticket dédié). Reproduit la chrome du mockup ; les données
 * proviennent du seam `useCurrentWorkspace` via la Sidebar conteneur.
 */
export function WorkspaceSwitcher({ name, plan, initials }: WorkspaceSwitcherProps) {
  return (
    <button
      type="button"
      aria-label="Changer d'espace de travail"
      className="border-border bg-surface hover:border-cyan m-3 flex h-11 items-center gap-2.5 rounded-md border px-3 transition-colors"
    >
      <span className="bg-cyan inline-flex h-7 w-7 items-center justify-center rounded-md text-[12px] font-bold text-white">
        {initials}
      </span>
      <span className="flex-1 text-left">
        <span className="text-text-primary block text-[12.5px] font-semibold">{name}</span>
        <span className="text-text-muted block text-[10.5px]">workspace · plan {plan}</span>
      </span>
      <Icon name="chevrons-up-down" size={13} className="opacity-60" />
    </button>
  )
}
