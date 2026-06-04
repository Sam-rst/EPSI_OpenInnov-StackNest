import { useStreamingLogs } from '../hooks/useStreamingLogs';
import { useStepProgress } from '../hooks/useStepProgress';
import { DeployHeader } from '../components/deploy/DeployHeader';
import { Stepper } from '../components/deploy/Stepper';
import { StreamedLogs } from '../components/deploy/StreamedLogs';
import { DeployDetailsCard } from '../components/deploy/DeployDetailsCard';
import { DeployCredentialsCard } from '../components/deploy/DeployCredentialsCard';

export function DeploymentPage() {
  const { lines, logRef } = useStreamingLogs();
  const { step, isDone } = useStepProgress();

  return (
    <div className="p-8 max-w-[1280px] mx-auto">
      <DeployHeader isDone={isDone} />
      <Stepper currentStep={step} />
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-[1fr_280px]">
        <StreamedLogs lines={lines} isDone={isDone} logRef={logRef} />
        <div className="space-y-4">
          <DeployDetailsCard />
          {isDone && <DeployCredentialsCard />}
        </div>
      </div>
    </div>
  );
}
