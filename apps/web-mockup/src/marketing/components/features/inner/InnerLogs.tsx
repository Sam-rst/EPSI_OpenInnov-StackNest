import { InnerLogsStep } from './InnerLogsStep';

const STEPS = ['Validation', 'Plan', 'Apply', 'Healthcheck'];

export function InnerLogs() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        {STEPS.map((label, i) => (
          <InnerLogsStep key={label} label={label} index={i} isLast={i === STEPS.length - 1} />
        ))}
      </div>
      <div className="font-mono text-[10.5px] rounded-md p-2.5 bg-code-bg border border-border space-y-0.5 text-text-secondary">
        <div><span className="text-text-muted">14:32:18</span> apply: docker_container.pg…</div>
        <div><span className="text-text-muted">14:32:19</span> creating volume pg-data</div>
        <div className="text-success">14:32:21 ✓ pg-prod ready (172.18.0.4)</div>
      </div>
    </div>
  );
}
