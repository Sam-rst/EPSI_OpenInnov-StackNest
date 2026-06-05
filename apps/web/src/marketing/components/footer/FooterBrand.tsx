import { useTheme } from '../../../core/theme/useTheme'
import { LogoMark } from '../../../shared/components/Logo'
import { Icon } from '../../../shared/components/ui'

/** Bloc identité du footer : logo, baseline et bascule de thème. */
export function FooterBrand() {
  const { theme, toggleTheme } = useTheme()
  const themeIcon = theme === 'dark' ? 'sun' : 'moon'
  const themeLabel = theme === 'dark' ? 'clair' : 'sombre'

  return (
    <div className="col-span-2">
      <span className="inline-flex items-center gap-2.5">
        <LogoMark size={28} alt="StackNest" />
        <span className="text-[17px] font-bold tracking-tight text-[#fffefa]">StackNest</span>
      </span>
      <p className="mt-4 max-w-[280px] text-[13.5px] leading-relaxed text-[#94aabb]">
        L&apos;Internal Developer Platform française. Build Fast. Deploy Smart.
      </p>
      <button
        type="button"
        onClick={toggleTheme}
        className="hover:border-cyan mt-5 inline-flex h-9 items-center gap-2 rounded-md border border-[#0d3e57] px-3 text-[12px] text-[#c7d4dd] transition"
      >
        <Icon name={themeIcon} size={13} />
        <span>Thème {themeLabel}</span>
      </button>
    </div>
  )
}
