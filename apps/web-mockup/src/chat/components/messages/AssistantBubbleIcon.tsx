import { Icon } from '@core/ui';

export function AssistantBubbleIcon() {
  return (
    <span className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5 bg-[color-mix(in_oklch,var(--brand-cyan)_14%,transparent)] text-cyan">
      <Icon name="sparkles" size={15} />
    </span>
  );
}
