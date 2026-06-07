import { Badge } from '../../../shared/components/ui'
import type { TemplateVersion } from '../../types/models/TemplateVersion'

interface TemplateVersionsTableProps {
  versions: readonly TemplateVersion[]
}

const formatEol = (eolDate: string | null): string => eolDate ?? '—'

/** Table des versions disponibles d'un template (défaut, LTS, fin de support). */
export function TemplateVersionsTable({ versions }: TemplateVersionsTableProps) {
  return (
    <section>
      <h2 className="text-text-primary mb-3 text-[15px] font-semibold">Versions</h2>
      {versions.length === 0 ? (
        <p className="text-text-muted text-[13px]">Aucune version publiée.</p>
      ) : (
        <div className="border-border overflow-hidden rounded-lg border">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-surface-sunken text-text-muted text-[11px] tracking-[0.06em] uppercase">
              <tr>
                <th className="px-4 py-2 font-semibold">Version</th>
                <th className="px-4 py-2 font-semibold">Étiquettes</th>
                <th className="px-4 py-2 font-semibold">Fin de support</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((version) => (
                <tr key={version.version} className="border-border border-t">
                  <td className="text-text-primary px-4 py-2.5 font-medium">{version.version}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      {version.isDefault && <Badge tone="cyan">Par défaut</Badge>}
                      {version.isLts && <Badge tone="success">LTS</Badge>}
                    </div>
                  </td>
                  <td className="text-text-secondary px-4 py-2.5">{formatEol(version.eolDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
