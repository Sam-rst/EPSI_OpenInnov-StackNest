export type Status = 'running' | 'stopped' | 'degraded' | 'error';

interface StatusDescriptor {
  color: string;
  label: string;
}

const STATUS_MAP: Record<Status, StatusDescriptor> = {
  running: { color: '#22c55e', label: 'En route' },
  stopped: { color: '#94a1ae', label: 'Arrêté' },
  degraded: { color: '#fea21f', label: 'Dégradé' },
  error: { color: '#c42b1c', label: 'Erreur' },
};

export function StatusDot({ status }: { status: Status }) {
  const descriptor = STATUS_MAP[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        className="relative inline-block w-2 h-2 rounded-full"
        style={{ background: descriptor.color }}
      >
        {status === 'running' && (
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-60"
            style={{ background: descriptor.color }}
          />
        )}
      </span>
      <span className="text-text-secondary">{descriptor.label}</span>
    </span>
  );
}
