import { Icon } from '@core/ui';

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<string>;
}

export function Select({ value, onChange, options }: SelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 pr-8 rounded-md border border-border bg-surface text-[13px] text-text-primary outline-none focus:border-cyan focus:ring-2 focus:ring-[color-mix(in_oklch,var(--brand-cyan)_30%,transparent)] appearance-none"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <Icon name="chevron-down" size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none" />
    </div>
  );
}
