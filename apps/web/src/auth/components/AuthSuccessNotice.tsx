import type { ReactNode } from 'react'

interface AuthSuccessNoticeProps {
  title: string
  children: ReactNode
}

/** Confirmation affichée après une action d'auth réussie (inscription, demande de reset). */
export function AuthSuccessNotice({ title, children }: AuthSuccessNoticeProps) {
  return (
    <div
      role="status"
      className="border-success/30 bg-success/10 space-y-1 rounded-md border px-4 py-3"
    >
      <p className="text-text-primary text-[14px] font-semibold">{title}</p>
      <p className="text-text-secondary text-[13px]">{children}</p>
    </div>
  )
}
