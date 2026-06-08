import { Link } from 'react-router-dom'

import { Icon } from '../../../shared/components/ui'

interface ConfigHeaderProps {
  templateName: string
  templateDescription: string
  templateIcon: string
}

/** En-tête de la page de configuration : retour catalogue + identité du template. */
export function ConfigHeader({
  templateName,
  templateDescription,
  templateIcon,
}: ConfigHeaderProps) {
  return (
    <div className="mb-6">
      <Link
        to="/catalog"
        className="text-text-muted hover:text-cyan mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium transition"
      >
        <Icon name="arrow-left" size={14} />
        Retour au catalogue
      </Link>
      <div className="flex items-center gap-3">
        <span className="text-cyan flex h-12 w-12 items-center justify-center rounded-xl bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)]">
          <Icon name={templateIcon} size={24} />
        </span>
        <div>
          <h1 className="text-text-primary text-[24px] font-bold tracking-[-0.02em]">
            Configurer {templateName}
          </h1>
          <p className="text-text-secondary text-[12.5px]">{templateDescription}</p>
        </div>
      </div>
    </div>
  )
}
