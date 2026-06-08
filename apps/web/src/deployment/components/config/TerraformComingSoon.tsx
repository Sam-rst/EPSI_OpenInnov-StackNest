import { Link } from 'react-router-dom'

import { Button, Icon } from '../../../shared/components/ui'

interface TerraformComingSoonProps {
  templateName: string
}

/**
 * Écran honnête pour les templates `engine === terraform` : le déploiement
 * Terraform n'est pas encore disponible au MVP. On n'affiche NI formulaire, NI
 * aperçu HCL — uniquement un message clair et un retour catalogue.
 */
export function TerraformComingSoon({ templateName }: TerraformComingSoonProps) {
  return (
    <div className="border-border text-text-muted flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
      <span className="text-cyan flex h-14 w-14 items-center justify-center rounded-xl bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)]">
        <Icon name="layers" size={26} />
      </span>
      <h2 className="text-text-secondary mt-4 text-[16px] font-semibold">
        Déploiement Terraform à venir
      </h2>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed">
        « {templateName} » est provisionné par Terraform. Le déploiement de ce type de ressource
        n'est pas encore disponible — il arrivera dans une prochaine version. Au MVP, seules les
        ressources Docker sont déployables.
      </p>
      <Link to="/catalog" className="mt-6">
        <Button variant="secondary" icon="arrow-left">
          Retour au catalogue
        </Button>
      </Link>
    </div>
  )
}
