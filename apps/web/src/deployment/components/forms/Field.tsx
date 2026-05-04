import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ label, hint, className = '', children }: FieldProps) {
  return (
    <label className={`block ${className}`}>
      <div className="text-[12px] font-medium mb-1.5 text-text-secondary">{label}</div>
      {children}
      {hint && <div className="text-[11px] mt-1 text-text-muted">{hint}</div>}
    </label>
  );
}
