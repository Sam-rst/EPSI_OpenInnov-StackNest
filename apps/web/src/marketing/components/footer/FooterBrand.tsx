import { Icon, LogoLockup } from '@core/ui';
import { useTheme } from '@core/theme/useTheme';

export function FooterBrand() {
  const { theme, toggleTheme } = useTheme();
  const themeIcon = theme === 'dark' ? 'sun' : 'moon';
  const themeLabel = theme === 'dark' ? 'clair' : 'sombre';

  return (
    <div className="col-span-2">
      <LogoLockup size={28} color="#fffefa" />
      <p className="mt-4 text-[13.5px] text-[#94aabb] leading-relaxed max-w-[280px]">
        L'Internal Developer Platform française. Build Fast. Deploy Smart.
      </p>
      <button
        type="button"
        onClick={toggleTheme}
        className="mt-5 inline-flex items-center gap-2 px-3 h-9 rounded-md border border-[#0d3e57] text-[12px] text-[#c7d4dd] hover:border-cyan transition"
      >
        <Icon name={themeIcon} size={13} />
        <span>Thème {themeLabel}</span>
      </button>
    </div>
  );
}
