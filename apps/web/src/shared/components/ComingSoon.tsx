import { Badge, Icon } from './ui'

interface ComingSoonProps {
  /** Nom d'icône lucide en kebab-case (ex. « users », « settings »). */
  icon: string
  title: string
  description: string
}

/**
 * Panneau « bientôt disponible » réutilisé par les pages encore non livrées
 * (Équipe, Paramètres, Configurer…). Le titre sert d'en-tête principal de la
 * zone main : il garantit qu'une route placeholder reste accessible (heading)
 * et cohérente avec la charte, sans dupliquer la mise en page dans chaque page.
 */
export function ComingSoon({ icon, title, description }: ComingSoonProps) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center px-4 text-center">
      <span className="text-cyan flex h-14 w-14 items-center justify-center rounded-xl bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)]">
        <Icon name={icon} size={26} />
      </span>
      <Badge tone="cyan" className="mt-5">
        Bientôt disponible
      </Badge>
      <h1 className="text-text-primary mt-4 text-2xl font-semibold">{title}</h1>
      <p className="text-text-secondary mt-2 max-w-md text-sm leading-relaxed">{description}</p>
    </div>
  )
}
