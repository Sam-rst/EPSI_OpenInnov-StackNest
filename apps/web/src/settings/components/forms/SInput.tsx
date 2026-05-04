import type { InputHTMLAttributes } from 'react';

const className =
  'w-full h-10 px-3 rounded-md border border-border bg-surface text-[13px] text-text-primary outline-none focus:border-cyan focus:ring-2 focus:ring-[color-mix(in_oklch,var(--brand-cyan)_30%,transparent)]';

export function SInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={className} />;
}
