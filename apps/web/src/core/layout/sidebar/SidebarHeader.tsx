import { LogoMark } from '../../../shared/components/Logo'

const APP_VERSION = 'v0.1.0'

/** En-tête de la Sidebar : symbole + wordmark + badge de version. */
export function SidebarHeader() {
  return (
    <div className="border-border flex h-14 items-center gap-2.5 border-b px-5">
      <LogoMark size={24} />
      <span className="text-text-primary text-[15px] font-bold tracking-tight">StackNest</span>
      <span className="border-border text-text-muted ml-auto inline-flex h-5 items-center rounded border px-1.5 font-mono text-[10px]">
        {APP_VERSION}
      </span>
    </div>
  )
}
