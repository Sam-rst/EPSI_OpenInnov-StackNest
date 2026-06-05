import { InnerLogsStep } from './InnerLogsStep'

const STEPS = ['Validation', 'Plan', 'Apply', 'Healthcheck']

/** Démo interne « suivi temps réel » : stepper + logs streamés illustratifs. */
export function InnerLogs() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        {STEPS.map((label, index) => (
          <InnerLogsStep key={label} label={label} index={index} isLast={index === STEPS.length - 1} />
        ))}
      </div>
      <div className="bg-code-bg border-border text-text-secondary space-y-0.5 rounded-md border p-2.5 font-mono text-[10.5px]">
        <div>
          <span className="text-text-muted">14:32:18</span> apply: docker_container.pg…
        </div>
        <div>
          <span className="text-text-muted">14:32:19</span> creating volume pg-data
        </div>
        <div className="text-success">14:32:21 ✓ pg-prod ready (172.18.0.4)</div>
      </div>
    </div>
  )
}
