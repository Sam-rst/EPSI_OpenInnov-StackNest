import { Icon } from '../../../shared/components/ui'

/** Pastille d'avatar de l'assistant ChatOps (icône « sparkles »). */
export function AssistantBubbleIcon() {
  return (
    <span className="text-cyan mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)]">
      <Icon name="sparkles" size={15} />
    </span>
  )
}
