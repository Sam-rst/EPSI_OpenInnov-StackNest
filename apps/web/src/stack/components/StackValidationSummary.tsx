import { Icon } from '../../shared/components/ui'

interface StackValidationSummaryProps {
  errors: readonly string[]
}

/**
 * Liste les erreurs de validation de la composition (alias, ≥ 1 service,
 * cycles…) avant déploiement. N'affiche rien quand la composition est valide.
 */
export function StackValidationSummary({ errors }: StackValidationSummaryProps) {
  if (errors.length === 0) {
    return null
  }

  return (
    <div
      role="alert"
      className="border-error/40 rounded-md border bg-[color-mix(in_oklch,#c42b1c_8%,transparent)] p-3"
    >
      <div className="text-error mb-1.5 flex items-center gap-2 text-[12.5px] font-semibold">
        <Icon name="triangle-alert" size={14} />
        Corrige ces points avant de déployer
      </div>
      <ul className="text-error list-disc space-y-0.5 pl-6 text-[12px]">
        {errors.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  )
}
