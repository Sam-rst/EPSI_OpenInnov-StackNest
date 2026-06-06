import { Icon } from '../../shared/components/ui'

/**
 * Panneau latéral d'aperçu Terraform. Display-only : aucun HCL n'est fabriqué.
 * Tant qu'aucun plan n'a été généré par l'assistant (backend à venir), on
 * affiche un état vide honnête plutôt qu'un faux extrait de code.
 */
export function TerraformAside() {
  return (
    <aside className="border-border bg-surface-elevated flex flex-col overflow-y-auto border-l">
      <div className="border-border border-b p-4">
        <div className="text-text-muted font-mono text-[11px] tracking-[0.14em] uppercase">
          Aperçu Terraform
        </div>
        <div className="text-text-secondary mt-1 text-[12px]">Généré à partir du plan validé</div>
      </div>
      <div className="text-text-muted flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <Icon name="file-code" size={22} className="opacity-60" />
        <p className="text-[12px] leading-relaxed">
          Aucun plan à prévisualiser. Le HCL s'affichera ici une fois un plan validé avec
          l'assistant.
        </p>
      </div>
    </aside>
  )
}
