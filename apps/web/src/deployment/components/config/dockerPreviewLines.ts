import type { DeploymentConfigValues } from '../../hooks/useDeploymentConfigForm'
import type { TemplateConfig } from '../../types/models/TemplateConfig'

/** Une ligne de l'aperçu Docker, étiquetée pour le flash live au changement. */
export interface DockerPreviewLine {
  /** Clé du champ source (déclenche le flash quand ce champ change). */
  flashKey: string
  text: string
}

/** Masque de remplacement du secret dans l'aperçu (jamais de mot de passe réel). */
export const MASKED_SECRET = '••••••••'

/** Nom de conteneur effectif : `stacknest-{nom}` (ou placeholder si nom vide). */
function containerName(name: string): string {
  const trimmed = name.trim()
  return trimmed.length > 0 ? `stacknest-${trimmed}` : 'stacknest-<nom>'
}

/** Image effective `repository:version`, ou un placeholder honnête si non dispo. */
function effectiveImage(template: TemplateConfig, version: string): string {
  if (template.imageRepository === null) {
    return `<image>:${version}`
  }
  return `${template.imageRepository}:${version}`
}

/**
 * Construit l'aperçu de la spec conteneur façon `docker run`, reflétant l'état
 * du formulaire. Le secret (`secretEnv`) est toujours masqué — aucun mot de
 * passe réel n'apparaît. Chaque ligne porte sa `flashKey` pour l'effet flash.
 */
export function buildDockerPreviewLines(
  template: TemplateConfig,
  values: DeploymentConfigValues,
): readonly DockerPreviewLine[] {
  const lines: DockerPreviewLine[] = [
    { flashKey: 'name', text: 'docker run -d \\' },
    { flashKey: 'name', text: `  --name ${containerName(values.name)} \\` },
    {
      flashKey: 'preset',
      text: `  --cpus ${values.preset.cpu} --memory ${values.preset.memoryMb}m \\`,
    },
    { flashKey: 'env', text: `  --env STACKNEST_ENV=${values.env} \\` },
  ]

  if (template.secretEnv !== null) {
    lines.push({ flashKey: 'name', text: `  --env ${template.secretEnv}=${MASKED_SECRET} \\` })
  }

  for (const param of template.params) {
    const value = values.params[param.key] ?? ''
    const printed = param.type === 'secret' ? MASKED_SECRET : value
    lines.push({ flashKey: `param:${param.key}`, text: `  --env ${param.key}=${printed} \\` })
  }

  if (template.internalPort !== null) {
    lines.push({
      flashKey: 'version',
      text: `  --publish <hôte>:${template.internalPort} \\`,
    })
  }

  lines.push({ flashKey: 'version', text: `  ${effectiveImage(template, values.version)}` })

  return lines
}
