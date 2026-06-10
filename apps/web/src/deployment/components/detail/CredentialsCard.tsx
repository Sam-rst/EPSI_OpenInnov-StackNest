import { useState } from 'react'

import { Button, Icon } from '../../../shared/components/ui'
import { Card } from '../common/Card'
import type { DeploymentAccess } from '../../types/models/DeploymentEvent'

interface CredentialsCardProps {
  access: DeploymentAccess
  /**
   * Nom d'utilisateur de connexion (ex. « postgres »), fourni par l'API (non
   * sensible). `null`/absent pour un template sans compte par défaut : la ligne
   * n'est alors pas affichée. Complète le mot de passe, qui seul ne suffit pas.
   */
  username?: string | null
}

/**
 * Carte d'accès affichée une seule fois au passage « running ». L'adresse
 * (`host:port`) et le mot de passe généré proviennent du flux SSE réel ; le nom
 * d'utilisateur (non sensible) vient de la ressource (REST). Le mot de passe est
 * masqué par défaut, révélable, et accompagné d'un avertissement « non
 * récupérable ensuite » (il ne transite qu'une seule fois).
 */
export function CredentialsCard({ access, username }: CredentialsCardProps) {
  const [revealed, setRevealed] = useState(false)

  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon name="key" size={14} className="text-cyan" />
        <span className="text-text-primary text-[12px] font-semibold">Accès</span>
      </div>
      <dl className="space-y-1.5 font-mono text-[11.5px]">
        <div className="flex justify-between gap-2">
          <dt className="text-text-muted">adresse</dt>
          <dd className="text-text-primary break-all">{access.url}</dd>
        </div>
        {username && (
          <div className="flex justify-between gap-2">
            <dt className="text-text-muted">utilisateur</dt>
            <dd className="text-text-primary break-all">{username}</dd>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <dt className="text-text-muted">mot de passe</dt>
          <dd className="text-text-primary flex items-center gap-2 break-all">
            {revealed ? access.password : '••••••••••'}
            <button
              type="button"
              onClick={() => setRevealed((value) => !value)}
              className="text-cyan"
              aria-label={revealed ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              <Icon name={revealed ? 'eye-off' : 'eye'} size={12} />
            </button>
          </dd>
        </div>
      </dl>
      <p className="text-text-muted mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed">
        <Icon name="triangle-alert" size={12} className="text-yellow mt-0.5 shrink-0" />
        Affiché une seule fois. Le mot de passe ne sera pas récupérable ensuite.
      </p>
      <Button variant="secondary" size="sm" icon="copy" className="mt-3 w-full">
        Copier la chaîne de connexion
      </Button>
    </Card>
  )
}
