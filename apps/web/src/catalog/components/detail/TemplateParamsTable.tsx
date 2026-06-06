import { Badge } from '../../../shared/components/ui'
import { labelForParamType } from '../../types/enums/ParamType'
import type { TemplateParam } from '../../types/models/TemplateParam'

interface TemplateParamsTableProps {
  params: readonly TemplateParam[]
}

const formatDefault = (param: TemplateParam): string => {
  if (param.defaultValue !== null) {
    return param.defaultValue
  }
  return '—'
}

/** Table des paramètres de provisioning d'un template (clé, type, défaut, requis). */
export function TemplateParamsTable({ params }: TemplateParamsTableProps) {
  return (
    <section>
      <h2 className="text-text-primary mb-3 text-[15px] font-semibold">Paramètres</h2>
      {params.length === 0 ? (
        <p className="text-text-muted text-[13px]">Aucun paramètre de configuration.</p>
      ) : (
        <div className="border-border overflow-hidden rounded-lg border">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-surface-sunken text-text-muted text-[11px] tracking-[0.06em] uppercase">
              <tr>
                <th className="px-4 py-2 font-semibold">Paramètre</th>
                <th className="px-4 py-2 font-semibold">Type</th>
                <th className="px-4 py-2 font-semibold">Défaut</th>
                <th className="px-4 py-2 font-semibold">Requis</th>
              </tr>
            </thead>
            <tbody>
              {params.map((param) => (
                <tr key={param.key} className="border-border border-t">
                  <td className="px-4 py-2.5">
                    <div className="text-text-primary font-medium">{param.label}</div>
                    <code className="text-text-muted text-[11.5px]">{param.key}</code>
                  </td>
                  <td className="text-text-secondary px-4 py-2.5">
                    {labelForParamType(param.type)}
                  </td>
                  <td className="text-text-secondary px-4 py-2.5">{formatDefault(param)}</td>
                  <td className="px-4 py-2.5">
                    {param.required ? (
                      <Badge tone="warn">Requis</Badge>
                    ) : (
                      <Badge tone="neutral">Optionnel</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
