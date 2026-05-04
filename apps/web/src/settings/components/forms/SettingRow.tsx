import { useState } from 'react';

interface SettingRowProps {
  label: string;
  hint: string;
  defaultOn: boolean;
}

export function SettingRow({ label, hint, defaultOn }: SettingRowProps) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-start justify-between py-3 border-t border-hairline">
      <div className="pr-6">
        <div className="text-[12.5px] font-medium text-text-primary">{label}</div>
        <div className="text-[11.5px] text-text-muted">{hint}</div>
      </div>
      <button
        type="button"
        onClick={() => setOn(!on)}
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 mt-0.5 ${
          on ? 'bg-cyan' : 'bg-surface-sunken border border-border'
        }`}
      >
        <span
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
          style={{ transform: on ? 'translateX(16px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  );
}
