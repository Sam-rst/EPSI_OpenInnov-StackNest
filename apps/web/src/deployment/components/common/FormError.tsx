import { Icon } from '../../../shared/components/ui'

interface FormErrorProps {
  message: string
}

/**
 * Bloc d'erreur visible affiché au-dessus d'un formulaire (échec API non
 * silencieux, #1). Rôle `alert` pour être annoncé aux lecteurs d'écran ; ton
 * « error » de la charte. Le message provient de l'API (cf. deploymentErrorMessage).
 */
export function FormError({ message }: FormErrorProps) {
  return (
    <div
      role="alert"
      className="border-error/40 bg-error/10 text-error flex items-start gap-2 rounded-md border px-3 py-2.5 text-[12.5px]"
    >
      <Icon name="triangle-alert" size={15} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
