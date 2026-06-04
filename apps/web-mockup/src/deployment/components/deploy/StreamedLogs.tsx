import { Card } from '@core/ui';
import { StreamedLogsHeader } from './StreamedLogsHeader';
import { StreamedLogsList } from './StreamedLogsList';
import type { LogLine } from '../../data/deploymentLogs';

interface StreamedLogsProps {
  lines: ReadonlyArray<LogLine>;
  isDone: boolean;
  logRef: React.RefObject<HTMLDivElement>;
}

export function StreamedLogs({ lines, isDone, logRef }: StreamedLogsProps) {
  return (
    <Card className="overflow-hidden">
      <StreamedLogsHeader />
      <StreamedLogsList lines={lines} isDone={isDone} logRef={logRef} />
    </Card>
  );
}
