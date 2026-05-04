interface StatTileProps {
  label: string;
  value: string;
}

export function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="rounded-md p-3 border border-border">
      <div className="text-[10.5px] font-mono uppercase tracking-wider text-text-muted">{label}</div>
      <div className="font-bold tracking-tight text-[18px] mt-1 text-text-primary">{value}</div>
    </div>
  );
}
