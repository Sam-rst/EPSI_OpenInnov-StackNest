import { ThemeToggle } from '../../../shared/components/ThemeToggle'
import { Icon } from '../../../shared/components/ui'

const ICON_BUTTON_CLASS =
  'border-border text-text-secondary hover:border-cyan inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors hover:bg-transparent'

/** Actions globales de la TopBar : notifications + bascule de thème. */
export function TopBarActions() {
  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label="Notifications" className={`relative ${ICON_BUTTON_CLASS}`}>
        <Icon name="bell" size={14} />
        <span className="bg-yellow absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full" />
      </button>
      <ThemeToggle className={ICON_BUTTON_CLASS} />
    </div>
  )
}
