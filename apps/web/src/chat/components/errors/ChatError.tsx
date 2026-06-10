import { Link } from 'react-router-dom'

import { Icon } from '../../../shared/components/ui'
import { cn } from '../../../shared/lib/cn'
import type { ChatErrorKind, ChatStreamError } from '../../types/models/ChatStreamState'

interface ChatErrorProps {
  /** Erreur typée du tour, ou `null` (rien à afficher). */
  error: ChatStreamError | null
  /** Réémet le dernier message utilisateur (B2). */
  onRetry: () => void
  /** Une reconnexion SSE est en cours : afficher la pastille plutôt que l'erreur (B4). */
  isReconnecting: boolean
}

/** Présentation visuelle d'une catégorie d'erreur : icône + intitulé + ton couleur. */
interface ErrorPresentation {
  /** Icône lucide (kebab-case) qui qualifie la nature de l'échec. */
  icon: string
  /** Intitulé court affiché avant le message détaillé. */
  title: string
  /** Classes de ton (couleur + fond) alignées sur la charte. */
  tone: string
  /** Propose-t-on de réessayer ? (inutile sur `auth` : il faut se reconnecter.) */
  retryable: boolean
}

/** Erreur réseau / auth → rouge d'erreur ; lenteur / inconnu → jaune d'avertissement. */
const ERROR_TONE_DANGER =
  'border-[color-mix(in_oklch,#c42b1c_30%,transparent)] bg-[color-mix(in_oklch,#c42b1c_8%,transparent)] text-[#a52215]'
const ERROR_TONE_WARN =
  'border-[color-mix(in_oklch,var(--color-yellow)_34%,transparent)] bg-[color-mix(in_oklch,var(--color-yellow)_10%,transparent)] text-[#9b5805]'

/**
 * Présentation par catégorie (B1) : chaque type d'échec a son icône, son intitulé
 * et son ton, pour un feedback contextualisé plutôt qu'un bandeau générique.
 *   - `network` → coupure : on rassure (« réessaie »), réessayable.
 *   - `timeout` → lenteur LLM : ton d'avertissement, réessayable.
 *   - `business` → erreur métier honnête : message du back + lien catalogue.
 *   - `auth`    → session expirée : on invite à se reconnecter (pas de retry).
 *   - `unknown` → filet de sécurité : générique, réessayable.
 */
const ERROR_PRESENTATIONS: Record<ChatErrorKind, ErrorPresentation> = {
  network: {
    icon: 'wifi-off',
    title: 'Connexion interrompue',
    tone: ERROR_TONE_DANGER,
    retryable: true,
  },
  timeout: {
    icon: 'clock',
    title: "L'assistant met du temps à répondre",
    tone: ERROR_TONE_WARN,
    retryable: true,
  },
  business: {
    icon: 'circle-alert',
    title: 'Demande non traitée',
    tone: ERROR_TONE_WARN,
    retryable: true,
  },
  auth: {
    icon: 'lock',
    title: 'Reconnecte-toi pour continuer',
    tone: ERROR_TONE_DANGER,
    retryable: false,
  },
  unknown: {
    icon: 'triangle-alert',
    title: 'Une erreur est survenue',
    tone: ERROR_TONE_DANGER,
    retryable: true,
  },
}

/**
 * Affichage d'erreur du chat, contextualisé par type (B1) + pastille de
 * reconnexion (B4) + bouton « Réessayer » (B2). Pendant une reconnexion SSE en
 * cours, on n'affiche pas une erreur dure mais une pastille douce, même si une
 * erreur résiduelle traîne dans l'état (transition réseau).
 *
 * Une erreur métier (`business`) affiche le message honnête du back tel quel et
 * propose un rebond vers le catalogue (souvent la cause : template introuvable).
 */
export function ChatError({ error, onRetry, isReconnecting }: ChatErrorProps) {
  if (isReconnecting) {
    return (
      <div role="status" className="text-text-muted my-2 flex items-center gap-2 text-[12.5px]">
        <Icon name="loader-circle" size={13} className="animate-spin" />
        <span>Reconnexion…</span>
      </div>
    )
  }

  if (error === null) {
    return null
  }

  const presentation = ERROR_PRESENTATIONS[error.kind]

  return (
    <div
      role="alert"
      className={cn(
        'my-2 flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-[12.5px]',
        presentation.tone,
      )}
    >
      <Icon name={presentation.icon} size={15} className="mt-0.5 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-medium">{presentation.title}</span>
        <span className="text-text-secondary">{error.message}</span>
        <div className="mt-0.5 flex items-center gap-3">
          {presentation.retryable && (
            <button
              type="button"
              onClick={onRetry}
              className="text-cyan inline-flex items-center gap-1 font-medium hover:underline"
            >
              <Icon name="rotate-ccw" size={12} />
              Réessayer
            </button>
          )}
          {error.kind === 'business' && (
            <Link to="/catalog" className="text-cyan font-medium hover:underline">
              Voir le catalogue
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
