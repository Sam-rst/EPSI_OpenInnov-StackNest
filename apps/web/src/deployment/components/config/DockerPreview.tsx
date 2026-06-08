import { motion } from 'framer-motion'

import { Badge, Icon } from '../../../shared/components/ui'
import { Card } from '../common/Card'
import { buildDockerPreviewLines } from './dockerPreviewLines'
import { useFlashKeys } from '../../hooks/useFlashKeys'
import type { DeploymentConfigValues } from '../../hooks/useDeploymentConfigForm'
import type { TemplateConfig } from '../../types/models/TemplateConfig'

interface DockerPreviewProps {
  template: TemplateConfig
  values: DeploymentConfigValues
}

/**
 * Aperçu live de la spec conteneur effective façon `docker run` : reflète l'état
 * du formulaire, masque le secret (`••••`) et flashe chaque ligne au changement
 * de sa source. Aucun mot de passe réel n'est jamais affiché.
 */
export function DockerPreview({ template, values }: DockerPreviewProps) {
  const lines = buildDockerPreviewLines(template, values)
  const flashed = useFlashKeys({
    name: values.name,
    env: values.env,
    version: values.version,
    preset: values.preset.id,
    params: values.params,
  })

  return (
    <Card className="overflow-hidden">
      <div className="border-border bg-surface-sunken flex h-10 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Icon name="container" size={13} className="text-cyan" />
          <span className="text-text-primary font-mono text-[12px]">aperçu Docker</span>
          <Badge tone="cyan">live</Badge>
        </div>
        <span className="text-text-muted text-[11px]">secret masqué</span>
      </div>
      <pre className="bg-code-bg text-text-primary overflow-x-auto p-4 font-mono text-[12px] leading-[1.7]">
        {lines.map((line, index) => (
          <motion.div
            // L'ordre des lignes est stable : l'index est une clé sûre ici.
            key={index}
            animate={{
              backgroundColor: flashed.has(line.flashKey)
                ? 'rgba(13,146,151,0.18)'
                : 'rgba(13,146,151,0)',
            }}
            transition={{ duration: 0.3 }}
            className="-mx-2 rounded px-2"
          >
            {line.text}
          </motion.div>
        ))}
      </pre>
    </Card>
  )
}
