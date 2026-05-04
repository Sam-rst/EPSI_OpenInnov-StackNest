import type { ReactNode } from 'react';

interface SFieldProps {
  label: string;
  children: ReactNode;
}

export function SField({ label, children }: SFieldProps) {
  return (
    <label className="block">
      <div className="text-[12px] font-medium mb-1.5 text-text-secondary">{label}</div>
      {children}
    </label>
  );
}
