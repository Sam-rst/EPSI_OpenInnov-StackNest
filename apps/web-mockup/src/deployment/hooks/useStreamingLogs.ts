import { useEffect, useRef, useState } from 'react';
import { DEPLOYMENT_LOGS, type LogLine } from '../data/deploymentLogs';

interface UseStreamingLogsResult {
  lines: LogLine[];
  logRef: React.RefObject<HTMLDivElement>;
}

export function useStreamingLogs(): UseStreamingLogsResult {
  const [lines, setLines] = useState<LogLine[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let i = 0;
    const total = DEPLOYMENT_LOGS.length;
    const tick = () => {
      if (i >= total) return;
      const line = DEPLOYMENT_LOGS[i];
      i += 1;
      if (line) setLines((prev) => [...prev, line]);
      window.setTimeout(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
      }, 20);
      const delay = 200 + Math.random() * 700;
      if (i < total) window.setTimeout(tick, delay);
    };
    tick();
  }, []);

  return { lines, logRef };
}
