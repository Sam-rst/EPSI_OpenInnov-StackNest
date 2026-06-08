import { Icon } from '../../../shared/components/ui'

/** Pastille d'avatar de l'assistant (icône étincelle aux tons charte). */
export function AssistantAvatar() {
  return (
    <span
      aria-hidden="true"
      className="text-cyan flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)]"
    >
      <Icon name="sparkles" size={16} />
    </span>
  )
}
