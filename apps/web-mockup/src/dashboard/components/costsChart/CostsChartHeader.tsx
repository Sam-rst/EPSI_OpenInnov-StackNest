interface CostsChartHeaderProps {
  total: number;
  average: number;
}

const RANGES = ['7j', '30j', '90j', '1an'];
const ACTIVE_INDEX = 1;

export function CostsChartHeader({ total, average }: CostsChartHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight text-text-primary">
          Coût quotidien (30 j)
        </h2>
        <p className="text-[12px] mt-0.5 text-text-muted">
          Total <span className="font-mono text-text-primary">{total} €</span> · moyenne{' '}
          <span className="font-mono text-text-primary">{average} €/j</span>
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-[11px]">
        {RANGES.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`px-2.5 h-7 rounded-md font-medium ${
              i === ACTIVE_INDEX
                ? 'bg-surface-sunken text-text-primary'
                : 'text-text-muted hover:bg-surface-sunken'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
