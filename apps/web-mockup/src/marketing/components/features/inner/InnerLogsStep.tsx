import { Icon } from '@core/ui';

interface InnerLogsStepProps {
  label: string;
  index: number;
  isLast: boolean;
}

const stepCircle = (idx: number) => {
  if (idx < 2) return 'bg-success text-white';
  if (idx === 2) return 'bg-cyan text-white';
  return 'bg-surface-sunken border border-border text-text-muted';
};

export function InnerLogsStep({ label, index, isLast }: InnerLogsStepProps) {
  const showCheck = index < 2;
  const showSpinner = index === 2;

  return (
    <div className="flex items-center flex-1">
      <div className="flex flex-col items-center gap-1.5">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${stepCircle(index)}`}>
          {showCheck && <Icon name="check" size={13} />}
          {showSpinner && <Icon name="loader-circle" size={13} className="animate-spin" />}
          {!showCheck && !showSpinner && <span className="text-[10px] font-mono">{index + 1}</span>}
        </div>
        <div className="text-[10px] font-medium text-text-secondary">{label}</div>
      </div>
      {!isLast && <div className="flex-1 h-px mx-1 bg-border mt-[-14px]" />}
    </div>
  );
}
