import { useEffect, useState } from 'react';
import { DEPLOY_STEPS } from '../data/deploymentLogs';

export function useStepProgress() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    let s = 0;
    const advance = () => {
      if (s >= DEPLOY_STEPS.length) return;
      setStep(s + 1);
      s += 1;
      const next = DEPLOY_STEPS[s];
      if (next) window.setTimeout(advance, next.duration);
    };
    window.setTimeout(advance, 800);
  }, []);

  return { step, isDone: step >= DEPLOY_STEPS.length };
}
