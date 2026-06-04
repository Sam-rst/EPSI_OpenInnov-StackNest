import { Icon } from '@core/ui';

export type StepState = 'done' | 'active' | 'pending';

interface StepperCircleProps {
  state: StepState;
  index: number;
}

const stateClass: Record<StepState, string> = {
  done: 'bg-success text-white shadow-[0_0_0_4px_color-mix(in_oklch,var(--brand-success)_20%,transparent)]',
  active: 'bg-cyan text-white shadow-[0_0_0_4px_color-mix(in_oklch,var(--brand-cyan)_20%,transparent)]',
  pending: 'bg-surface-sunken text-text-muted border border-border',
};

export function StepperCircle({ state, index }: StepperCircleProps) {
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono text-[12px] font-semibold transition-all duration-300 ${stateClass[state]}`}>
      {state === 'done' && <Icon name="check" size={15} />}
      {state === 'active' && <Icon name="loader-circle" size={15} className="animate-spin" />}
      {state === 'pending' && <span>{index + 1}</span>}
    </div>
  );
}
