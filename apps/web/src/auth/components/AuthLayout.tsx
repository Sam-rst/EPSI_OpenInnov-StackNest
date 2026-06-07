import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { LogoLockup } from '../../shared/components/Logo'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  /** Bas de carte optionnel (liens secondaires : créer un compte, retour connexion…). */
  footer?: ReactNode
}

/**
 * Coquille commune des pages d'authentification : logo cliquable vers l'accueil,
 * titre, sous-titre et contenu (formulaire). Centrée, largeur de carte fixe.
 */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <main className="bg-surface flex min-h-dvh flex-1 items-center justify-center p-6 sm:p-10">
      <div className="w-full max-w-[400px]">
        <Link to="/" className="mb-10 inline-flex transition hover:opacity-80">
          <LogoLockup size={32} />
        </Link>
        <h1 className="text-text-primary text-[28px] leading-tight font-bold tracking-[-0.02em]">
          {title}
        </h1>
        <p className="text-text-secondary mt-2 text-[14px]">{subtitle}</p>
        <div className="mt-8">{children}</div>
        {footer && <div className="text-text-secondary mt-8 text-center text-[13px]">{footer}</div>}
      </div>
    </main>
  )
}
