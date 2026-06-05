import { Avatar, Icon } from '../../../shared/components/ui'

interface TopBarUserProps {
  name: string
  role: string
  /** Couleur de la pastille d'initiales (jaune de marque par défaut). */
  color?: string
}

/** Bloc utilisateur de la TopBar : avatar + identité (nom, rôle). */
export function TopBarUser({ name, role, color = '#fea21f' }: TopBarUserProps) {
  return (
    <button type="button" className="group flex items-center gap-2.5">
      <Avatar name={name} color={color} size={30} />
      <span className="hidden text-left md:block">
        <span className="text-text-primary block text-[12.5px] leading-tight font-semibold">
          {name}
        </span>
        <span className="text-text-muted block text-[11px] leading-tight">{role}</span>
      </span>
      <Icon name="chevron-down" size={12} className="opacity-50" />
    </button>
  )
}
