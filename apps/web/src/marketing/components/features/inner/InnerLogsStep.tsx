import { Icon } from '../../../../shared/components/ui'

interface InnerLogsStepProps {
  label: string
  index: number
  isLast: boolean
}

const stepCircle = (index: number): string => {
  if (index < 2) {
    return 'bg-success text-white'
  }
  if (index === 2) {
    return 'bg-cyan text-white'
  }
  return 'bg-surface-sunken border border-border text-text-muted'
}

/** Étape du stepper de déploiement (validé / en cours / à venir). */
export function InnerLogsStep({ label, index, isLast }: InnerLogsStepProps) {
  const showCheck = index < 2
  const showSpinner = index === 2

  return (
    <div className="flex flex-1 items-center">
      <div className="flex flex-col items-center gap-1.5">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-full ${stepCircle(index)}`}
        >
          {showCheck && <Icon name="check" size={13} />}
          {showSpinner && <Icon name="loader-circle" size={13} className="animate-spin" />}
          {!showCheck && !showSpinner && <span className="font-mono text-[10px]">{index + 1}</span>}
        </div>
        <div className="text-text-secondary text-[10px] font-medium">{label}</div>
      </div>
      {!isLast && <div className="bg-border mt-[-14px] mx-1 h-px flex-1" />}
    </div>
  )
}
