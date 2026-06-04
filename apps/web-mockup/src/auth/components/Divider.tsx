interface DividerProps {
  label: string;
}

export function Divider({ label }: DividerProps) {
  return (
    <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.16em] text-text-muted">
      <span className="flex-1 h-px bg-hairline" />
      {label}
      <span className="flex-1 h-px bg-hairline" />
    </div>
  );
}
