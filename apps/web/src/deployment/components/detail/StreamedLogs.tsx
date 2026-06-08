import { useEffect, useRef } from 'react'

import { Icon } from '../../../shared/components/ui'
import { Card } from '../common/Card'
import type { DeploymentLog, DeploymentLogLevel } from '../../types/models/DeploymentEvent'

interface StreamedLogsProps {
  logs: readonly DeploymentLog[]
  isDone: boolean
}

const LEVEL_CLASS: Record<DeploymentLogLevel, string> = {
  ok: 'text-success',
  err: 'text-error',
  info: 'text-text-secondary',
}

function LiveBadge({ isDone }: { isDone: boolean }) {
  if (isDone) {
    return <span className="text-text-muted text-[11px]">terminé</span>
  }
  return (
    <span className="text-success inline-flex items-center gap-1.5 text-[11px]">
      <span className="bg-success h-1.5 w-1.5 animate-pulse rounded-full" /> live
    </span>
  )
}

/**
 * Console de logs streamés via SSE. Auto-scroll en bas à chaque nouvelle ligne ;
 * chaque ligne est dérivée du `message` de l'event de progression réel.
 */
export function StreamedLogs({ logs, isDone }: StreamedLogsProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = containerRef.current
    if (node) {
      node.scrollTop = node.scrollHeight
    }
  }, [logs])

  return (
    <Card className="overflow-hidden">
      <div className="border-border bg-surface-sunken flex h-10 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Icon name="terminal" size={13} className="text-cyan" />
          <span className="text-text-primary font-mono text-[12px]">Logs</span>
        </div>
        <LiveBadge isDone={isDone} />
      </div>
      <div
        ref={containerRef}
        className="bg-code-bg text-text-primary overflow-y-auto p-4 font-mono text-[12px] leading-[1.7]"
        style={{ height: 380 }}
      >
        {logs.length === 0 ? (
          <span className="text-text-muted">En attente des premiers logs…</span>
        ) : (
          logs.map((line, index) => (
            <div key={index} className="flex gap-3">
              <span className="text-text-muted">{line.time}</span>
              <span className={LEVEL_CLASS[line.level]}>{line.message}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
