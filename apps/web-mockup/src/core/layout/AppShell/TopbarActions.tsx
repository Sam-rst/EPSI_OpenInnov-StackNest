import { Icon } from '@core/ui';
import { useTheme } from '@core/theme/useTheme';

export function TopbarActions() {
  const { theme, toggleTheme } = useTheme();
  const themeIcon = theme === 'dark' ? 'sun' : 'moon';
  const themeLabel = `Passer en thème ${theme === 'dark' ? 'clair' : 'sombre'}`;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-border text-text-secondary hover:border-cyan transition relative"
        aria-label="Notifications"
      >
        <Icon name="bell" size={14} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-sun" />
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-border text-text-secondary hover:border-cyan transition"
        title={themeLabel}
        aria-label={themeLabel}
      >
        <Icon name={themeIcon} size={14} />
      </button>
    </div>
  );
}
