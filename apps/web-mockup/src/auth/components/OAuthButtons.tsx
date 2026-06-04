import { Icon } from '@core/ui';

const OAUTH_PROVIDERS = [
  { id: 'github', label: 'GitHub', icon: 'github' },
  { id: 'gitlab', label: 'GitLab', icon: 'git-branch' },
] as const;

export function OAuthButtons() {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {OAUTH_PROVIDERS.map((p) => (
        <button
          key={p.id}
          type="button"
          className="h-11 inline-flex items-center justify-center gap-2 rounded-md border border-border bg-surface-elevated text-[13.5px] font-medium text-text-primary hover:border-cyan transition"
        >
          <Icon name={p.icon} size={15} />
          {p.label}
        </button>
      ))}
    </div>
  );
}
