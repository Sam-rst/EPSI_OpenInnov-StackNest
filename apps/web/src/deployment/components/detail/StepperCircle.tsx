import { Icon } from '../../../shared/components/ui'

export type StepState = 'done' | 'active' | 'pending'

interface StepperCircleProps {
  state: StepState
  index: number
}

const STATE_CLASS: Record<StepState, string> = {
  done: 'bg-success text-white',
  active: 'bg-cyan text-white',
  pending: 'bg-surface-sunken text-text-muted border border-border',
}

/** Pastille d'une étape du stepper Docker (check / spinner actif / index en attente). */
export function StepperCircle({ state, index }: StepperCircleProps) {
  return (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-full font-mono text-[12px] font-semibold transition-all duration-300 ${STATE_CLASS[state]}`}
    >
      {state === 'done' && <Icon name="check" size={15} />}
      {state === 'active' && <Icon name="loader-circle" size={15} className="animate-spin" />}
      {state === 'pending' && <span>{index + 1}</span>}
    </div>
  )
}
