import { Card } from '../common/Card'
import type { Deployment } from '../../types/models/Deployment'

interface DetailsCardProps {
  deployment: Deployment
}

function formatDate(iso: string | null): string {
  if (iso === null) {
    return '—'
  }
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('fr-FR')
}

/** Carte Détails : template+version, accès host:port, params et date de création. */
export function DetailsCard({ deployment }: DetailsCardProps) {
  const rows: readonly (readonly [string, string])[] = [
    ['Template', `${deployment.templateId} · ${deployment.version}`],
    ['Accès', deployment.accessUrl ?? 'indisponible'],
    ['Créé le', formatDate(deployment.createdAt)],
  ]
  const paramEntries = Object.entries(deployment.params)

  return (
    <Card className="p-4">
      <h2 className="text-text-muted mb-3 font-mono text-[11px] tracking-[0.14em] uppercase">
        Détails
      </h2>
      <dl className="space-y-2.5 text-[12px]">
        {rows.map(([key, value]) => (
          <div key={key} className="flex justify-between gap-3">
            <dt className="text-text-muted">{key}</dt>
            <dd className="text-text-primary text-right font-mono break-all">{value}</dd>
          </div>
        ))}
      </dl>
      {paramEntries.length > 0 && (
        <>
          <div className="text-text-muted mt-4 mb-2 font-mono text-[11px] tracking-[0.14em] uppercase">
            Paramètres
          </div>
          <dl className="space-y-2 text-[12px]">
            {paramEntries.map(([key, value]) => (
              <div key={key} className="flex justify-between gap-3">
                <dt className="text-text-muted font-mono">{key}</dt>
                <dd className="text-text-primary text-right font-mono break-all">{value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </Card>
  )
}
