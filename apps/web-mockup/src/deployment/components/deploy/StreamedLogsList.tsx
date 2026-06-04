import { motion } from 'framer-motion';
import type { LogLine } from '../../data/deploymentLogs';

interface StreamedLogsListProps {
  lines: ReadonlyArray<LogLine>;
  isDone: boolean;
  logRef: React.RefObject<HTMLDivElement>;
}

const levelClass = (level: LogLine['level']) => {
  if (level === 'ok') return 'text-success';
  if (level === 'err') return 'text-danger';
  return 'text-text-secondary';
};

export function StreamedLogsList({ lines, isDone, logRef }: StreamedLogsListProps) {
  return (
    <div
      ref={logRef}
      className="font-mono text-[12px] leading-[1.7] p-4 overflow-y-auto bg-code-bg text-text-primary"
      style={{ height: 420 }}
    >
      {lines.map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-3"
        >
          <span className="text-text-muted">{line.time}</span>
          <span className={levelClass(line.level)}>{line.message}</span>
        </motion.div>
      ))}
      {!isDone && <span className="typing-caret" />}
    </div>
  );
}
