interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}

export function Toggle({ checked, onChange, label, hint }: ToggleProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <span
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 mt-0.5 ${
          checked ? 'bg-cyan' : 'bg-surface-sunken border border-border'
        }`}
      >
        <span
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
          style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
        />
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span>
        <span className="block text-[12.5px] font-medium text-text-primary">{label}</span>
        {hint && <span className="block text-[11.5px] mt-0.5 text-text-muted">{hint}</span>}
      </span>
    </label>
  );
}
